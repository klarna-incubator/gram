import log4js from "log4js";
import { DataAccessLayer } from "../data/dal.js";
import { Review } from "../data/reviews/Review.js";
import { ActionItemExporter } from "./ActionItemExporter.js";
import {
  ActionItemExportError,
  ActionItemExportFailure,
  formatExportFailureCause,
} from "./ActionItemExportError.js";
import Threat from "../data/threats/Threat.js";

const log = log4js.getLogger("ActionItemHandler");

export const DEFAULT_FAILURE_LIST_LIMIT = 10;
export const DEFAULT_FAILURE_LIST_OFFSET = 0;

export type ActionItemFailureFilter = {
  exporter?: string;
  modelId?: string;
  threatId?: string;
  /** Inclusive lower bound against `created_at`. */
  createdAfter?: Date | string;
  /** Inclusive upper bound against `created_at`. */
  createdBefore?: Date | string;
};

export type ActionItemFailureListFilter = ActionItemFailureFilter & {
  limit?: number;
  offset?: number;
};

function failureFilterClause(filter: ActionItemFailureFilter) {
  const conditions: string[] = [];
  const params: (string | Date | number)[] = [];

  if (filter.exporter) {
    params.push(filter.exporter);
    conditions.push(`exporter = $${params.length}`);
  }
  if (filter.modelId) {
    params.push(filter.modelId);
    conditions.push(`model_id = $${params.length}`);
  }
  if (filter.threatId) {
    params.push(filter.threatId);
    conditions.push(`threat_id = $${params.length}`);
  }
  if (filter.createdAfter) {
    params.push(filter.createdAfter);
    conditions.push(`created_at >= $${params.length}::timestamptz`);
  }
  if (filter.createdBefore) {
    params.push(filter.createdBefore);
    conditions.push(`created_at <= $${params.length}::timestamptz`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

export class ActionItemHandler {
  public exporters: ActionItemExporter[] = [];

  constructor(private dal: DataAccessLayer) {
    this.dal.reviewService.on("approved", ({ review }) => {
      this.onReviewApproved(review);
    });
  }

  attachExporter(exporter: ActionItemExporter) {
    this.exporters.push(exporter);
    log.info("Attached action item exporter ", exporter.key);
  }

  async onReviewApproved(review: Review) {
    if (this.exporters.length === 0) {
      log.debug("No exporters for action items. Skipping export");
      return;
    }

    const actionItems = await this.dal.threatService.listActionItems(
      review.modelId
    );
    log.info(`Found ${actionItems.length} action items to export`);

    const promises = this.exporters
      .filter((exporter) => exporter.exportOnReviewApproved)
      .map(async (exporter) => {
        await this.runExport(exporter, actionItems);
      });

    await Promise.all(promises);
  }

  async export(exporterKey: string, actionItems: Threat[]) {
    log.info(`Found ${actionItems.length} action items to export`);

    const exporter = this.exporters.find((e) => e.key === exporterKey);

    if (!exporter) {
      throw new Error(`No such exporter ${exporterKey}`);
    }

    await this.runExport(exporter, actionItems);
  }

  async runExport(exporter: ActionItemExporter, actionItems: Threat[]) {
    try {
      await exporter.export(this.dal, actionItems);
      log.info(`Exported action items to exporter`, {
        payload: { count: actionItems.length },
        meta: { exporter: exporter.key },
      });
    } catch (e) {
      // Handle errors gracefully to avoid fatal errors crashing the entire app
      log.error(`Failed to export action items to exporter`, {
        payload: { count: actionItems.length, error: e },
        meta: { exporter: exporter.key },
      });
      const failures =
        e instanceof ActionItemExportError
          ? e.failures
          : actionItems.map((actionItem) => ({
              actionItem,
              cause: formatExportFailureCause(e),
            }));
      await this.trackFailedExports(exporter, failures);
    }
  }

  async trackFailedExports(
    exporter: ActionItemExporter,
    failures: ActionItemExportFailure[]
  ) {
    await Promise.all(
      failures.map(async ({ actionItem, cause }) => {
        await this.dal.pool.query(
          `INSERT INTO action_item_failed_exports (exporter, model_id, threat_id, cause) VALUES ($1, $2, $3, $4)`,
          [exporter.key, actionItem.modelId, actionItem.id, cause]
        );
      })
    );
  }

  /**
   * Count failed exports matching the given filters. Combined filters are ANDed.
   * With no filters (or an empty filter), all failed exports are counted.
   */
  async countFailures(filter: ActionItemFailureFilter = {}) {
    const { where, params } = failureFilterClause(filter);
    const query = `SELECT COUNT(*) as count FROM action_item_failed_exports ${where}`;
    const res = await this.dal.pool.query(query, params);
    return parseInt(res.rows[0].count);
  }

  /**
   * List failed exports matching the given filters. Combined filters are ANDed.
   * Pagination defaults to limit 10 and offset 0.
   */
  async listFailures(filter: ActionItemFailureListFilter = {}) {
    const { where, params } = failureFilterClause(filter);
    params.push(
      filter.limit ?? DEFAULT_FAILURE_LIST_LIMIT,
      filter.offset ?? DEFAULT_FAILURE_LIST_OFFSET
    );
    const query = `
      SELECT * FROM action_item_failed_exports ${where}
      ORDER BY created_at DESC, id DESC
      LIMIT $${params.length - 1}::int OFFSET $${params.length}::int`;
    const res = await this.dal.pool.query(query, params);
    return res.rows;
  }

  /**
   * Clear failed exports matching the given filters. Combined filters are ANDed.
   * With no filters (or an empty filter), all failed exports are deleted.
   */
  async clearFailures(filter: ActionItemFailureFilter = {}) {
    const { where, params } = failureFilterClause(filter);
    const query = `DELETE FROM action_item_failed_exports ${where} RETURNING *`;
    const res = await this.dal.pool.query(query, params);
    return res.rows;
  }

  async clearFailureById(id: string) {
    const query = `DELETE FROM action_item_failed_exports WHERE id = $1 RETURNING *`;
    const res = await this.dal.pool.query(query, [id]);
    return res.rows[0];
  }

  /**
   * Retry failed exports matching the given filters. Combined filters are ANDed.
   * With no filters (or an empty filter), all failed exports are retried.
   */
  async retryFailures(filter: ActionItemFailureFilter = {}) {
    const { where, params } = failureFilterClause(filter);

    const failures = await this.listFailures({ ...filter, limit: 0 });
    if (failures.length === 0) {
      return { retries: 0, filters: filter };
    }
    const promises = failures.map(async (failure) => {
      const threats = await this.dal.threatService.listByIds([
        failure.threat_id,
      ]);
      if (threats.length === 0) {
        return;
      }
      const exportResult = await this.runExport(failure.exporter, threats);
    });
    await Promise.all(promises);
    return { retries: failures.length, filters: filter };
  }
}

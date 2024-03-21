import log4js from "log4js";
import { DataAccessLayer } from "../data/dal.js";
import { Review } from "../data/reviews/Review.js";
import { ActionItemExporter } from "./ActionItemExporter.js";
import Threat from "../data/threats/Threat.js";

const log = log4js.getLogger("ActionItemHandler");

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
      log.info(
        `Exported ${actionItems.length} action items to ${exporter.key}`
      );
    } catch (e) {
      // Handle errors gracefully to avoid fatal errors crashing the entire app
      log.error(`Failed to export to ${exporter.key}`, e);
      await this.trackFailedExports(exporter, actionItems);
    }
  }

  async trackFailedExports(
    exporter: ActionItemExporter,
    actionItems: Threat[]
  ) {
    await Promise.all(
      actionItems.map(async (actionItem) => {
        await this.dal.pool.query(
          `INSERT INTO action_item_failed_exports (exporter, model_id, threat_id) VALUES ($1, $2, $3)`,
          [exporter.key, actionItem.modelId, actionItem.id]
        );
      })
    );
  }

  /**
   * Count number of exports current marked as failed.
   */
  async countFailures() {
    const query = `
        SELECT COUNT(*) as count FROM action_item_failed_exports`;
    const res = await this.dal.pool.query(query);
    return parseInt(res.rows[0].count);
  }
}

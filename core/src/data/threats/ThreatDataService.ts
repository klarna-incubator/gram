/**
 * Postgres 12.4 implementation for `threats`
 * @module data/threats/postgres
 * @exports threats
 */

import { EventEmitter } from "events";
import log4js from "log4js";
import { SuggestionID } from "../../suggestions/models.js";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";
import { SuggestionStatus } from "../suggestions/Suggestion.js";
import Threat, { ThreatSeverity } from "./Threat.js";
import { randomUUID } from "crypto";

export function convertToThreat(row: any): Threat {
  const threat = new Threat(
    row.title,
    row.description,
    row.model_id,
    row.component_id,
    row.created_by,
    row.suggestion_id ? new SuggestionID(row.suggestion_id) : undefined
  );
  threat.id = row.id;
  threat.createdAt = row.created_at * 1000;
  threat.updatedAt = row.updated_at * 1000;
  threat.isActionItem = row.is_action_item || false;
  threat.severity = row.severity;
  return threat;
}

export type ExportStatusFilter = "exported" | "not-exported";

/**
 * Filter for the admin cross-system action item query.
 * Export status is derived from the presence of links on the item, regardless of
 * `created_by`. When `exportDomain` is set, an item only counts as exported (and
 * passes the `exportStatus` filter) when it has a link whose URL host equals, or
 * is a subdomain of, ANY of the supplied domains — a true host match.
 * `exportLinks` always returns every link on the item, independent of
 * `exportDomain`.
 */
export interface ActionItemFilter {
  systemIds?: string[];
  createdFrom?: string; // ISO 8601 — compared against the timestamptz column
  createdTo?: string;
  reviewApprovedFrom?: string;
  reviewApprovedTo?: string;
  severities?: ThreatSeverity[];
  exportStatus?: ExportStatusFilter;
  exportDomain?: string[]; // optional host filter, e.g. ["jira.com", "github.com"]
  limit: number;
  offset: number;
}

export interface ActionItemExportLink {
  url: string;
  createdBy: string;
  createdAt: number; // ms
}

export interface AdminActionItem {
  threat: Threat;
  systemId: string | null;
  reviewApprovedAt: number | null; // ms
  exported: boolean; // has a (matching, when exportDomain is set) link
  exportLinks: ActionItemExportLink[]; // all links on the item
}

export class ThreatDataService extends EventEmitter {
  constructor(private dal: DataAccessLayer) {
    super();
    this.pool = dal.pool;
    this.log = log4js.getLogger("ThreatDataService");
  }

  private pool: GramConnectionPool;
  log: any;

  /**
   * Create the threat object
   * @param {Threat} threat - Threat creation object
   * @returns {string}
   */
  async create(threat: Threat): Promise<string> {
    const query = `
     INSERT INTO threats (title, description, model_id, component_id, created_by, suggestion_id)
     VALUES ($1::varchar, $2::varchar, $3::uuid, $4::uuid, $5::varchar, $6)
     RETURNING id;
    `;
    const {
      title,
      description,
      modelId,
      componentId,
      createdBy,
      suggestionId,
    } = threat;
    const res = await this.pool.query(query, [
      title,
      description,
      modelId,
      componentId,
      createdBy,
      suggestionId?.val,
    ]);

    this.emit("updated-for", { modelId, componentId });

    return res.rows[0].id;
  }

  /**
   * Retrieve a threat object
   * @param {string} id - Threat identifier
   * @returns {Threat}
   */
  async getById(id: string) {
    const query = `
      SELECT
        id,
        title,
        description,
        model_id,
        component_id,
        suggestion_id,
        created_by,
        extract(epoch from created_at) as created_at,
        extract(epoch from updated_at) as updated_at,
        is_action_item,
        severity
      FROM threats
      WHERE id = $1::uuid
      AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;
    const res = await this.pool.query(query, [id]);

    if (res.rows.length === 0) {
      return null;
    }

    return convertToThreat(res.rows[0]);
  }

  /**
   * Retrieve the threat object
   * @param {string} modelId - Model system identifier
   * @returns {[Threat]}
   */
  async list(modelId: string) {
    const query = `
      SELECT
        id,
        title,
        description,
        model_id,
        component_id,
        created_by,
        extract(epoch from created_at) as created_at,
        extract(epoch from updated_at) as updated_at,
        suggestion_id,
        is_action_item,
        severity
      FROM threats
      WHERE model_id = $1::uuid 
      AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const res = await this.pool.query(query, [modelId]);

    return res.rows.map((record) => convertToThreat(record));
  }

  async listActionItems(modelId: string): Promise<Threat[]> {
    const query = `
    SELECT
      t.id,
      t.title,
      t.description,
      t.model_id,
      t.component_id,
      t.created_by,
      extract(epoch from t.created_at) as created_at,
      extract(epoch from t.updated_at) as updated_at,
      t.suggestion_id,
      t.is_action_item,
      t.severity
    FROM threats AS t    
    WHERE 
      t.model_id = $1::uuid 
      AND t.is_action_item = true
      AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  `;
    const res = await this.pool.query(query, [modelId]);

    if (res.rows.length === 0) {
      return [];
    }

    return res.rows.map((record) => convertToThreat(record));
  }

  /**
   * Hydrate threats by id, for any is_action_item value (the caller partitions).
   * Single round-trip; returns only non-deleted threats. Returns [] for empty input.
   */
  async listByIds(ids: string[]): Promise<Threat[]> {
    if (ids.length === 0) {
      return [];
    }
    const query = `
      SELECT
        id,
        title,
        description,
        model_id,
        component_id,
        created_by,
        extract(epoch from created_at) as created_at,
        extract(epoch from updated_at) as updated_at,
        suggestion_id,
        is_action_item,
        severity
      FROM threats
      WHERE id = ANY($1::uuid[])
      AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const res = await this.pool.query(query, [ids]);
    return res.rows.map((record) => convertToThreat(record));
  }

  /**
   * Admin cross-system action item query (Endpoint 1). Pure data query over
   * threats / models / reviews / links — applies no exporter skip logic.
   * "exported" = the threat has at least one links row (regardless of
   * created_by); when filter.exportDomain is set, only links whose URL host
   * equals or is a subdomain of ANY supplied domain count. exportLinks always
   * returns every link on the item.
   */
  async listActionItemsFiltered(
    filter: ActionItemFilter
  ): Promise<{ total: number; items: AdminActionItem[] }> {
    // Lowercased domains for the host `=` comparison; a matching set of
    // subdomain LIKE patterns (`%.<domain>`) with LIKE wildcards (`\`, `%`, `_`)
    // escaped so each domain is matched literally. An item matches when a link
    // host equals or is a subdomain of ANY supplied domain.
    const exportDomains =
      filter.exportDomain && filter.exportDomain.length > 0
        ? filter.exportDomain.map((d) => d.toLowerCase())
        : null;
    const exportDomainPatterns = exportDomains
      ? exportDomains.map((d) => "%." + d.replace(/([\\%_])/g, "\\$1"))
      : null;

    const params: any[] = [
      exportDomains, // $1 — host equality set + presence gate
      exportDomainPatterns, // $2 — escaped subdomain LIKE patterns
      filter.systemIds ?? null, // $3
      filter.createdFrom ?? null, // $4
      filter.createdTo ?? null, // $5
      filter.reviewApprovedFrom ?? null, // $6
      filter.reviewApprovedTo ?? null, // $7
      filter.exportStatus ?? null, // $8
      filter.limit, // $9
      filter.offset, // $10
      filter.severities ?? null, // $11
    ];

    const query = `
      SELECT
        t.id,
        t.title,
        t.description,
        t.model_id,
        t.component_id,
        t.created_by,
        t.suggestion_id,
        extract(epoch from t.created_at) as created_at,
        extract(epoch from t.updated_at) as updated_at,
        t.is_action_item,
        t.severity,
        m.system_id,
        extract(epoch from r.approved_at) as review_approved_at,
        COALESCE(l.matched, false) as exported,
        COALESCE(l.links, '[]'::json) as export_links,
        COUNT(*) OVER() as total
      FROM threats t
      JOIN models m ON m.id = t.model_id
      LEFT JOIN reviews r ON r.model_id = t.model_id
      LEFT JOIN LATERAL (
        SELECT
          CASE
            WHEN $1::text[] IS NULL THEN count(*) > 0
            ELSE COALESCE(bool_or(
              tl.host = ANY($1::text[])
              OR tl.host LIKE ANY($2::text[])
            ), false)
          END as matched,
          json_agg(json_build_object(
            'url', tl.url,
            'createdBy', tl.created_by,
            'createdAt', extract(epoch from tl.created_at)
          )) as links
        FROM (
          SELECT
            url,
            created_by,
            created_at,
            lower(substring(url from '://(?:[^@/?#]*@)?([^:/?#]+)')) as host
          FROM links
          WHERE object_type = 'threat'
            AND object_id = t.id::text
        ) tl
      ) l ON true
      WHERE t.is_action_item = true
        AND t.deleted_at IS NULL
        AND ($3::varchar[] IS NULL OR m.system_id = ANY($3::varchar[]))
        AND ($4::timestamptz IS NULL OR t.created_at >= $4::timestamptz)
        AND ($5::timestamptz IS NULL OR t.created_at <= $5::timestamptz)
        AND ($6::timestamptz IS NULL OR r.approved_at >= $6::timestamptz)
        AND ($7::timestamptz IS NULL OR r.approved_at <= $7::timestamptz)
        AND ($11::varchar[] IS NULL OR t.severity = ANY($11::varchar[]))
        AND ($8::text IS NULL
          OR ($8 = 'exported' AND COALESCE(l.matched, false))
          OR ($8 = 'not-exported' AND NOT COALESCE(l.matched, false)))
      ORDER BY t.created_at DESC
      LIMIT $9::int OFFSET $10::int
    `;

    const res = await this.pool.query(query, params);

    const total = res.rows.length > 0 ? parseInt(res.rows[0].total, 10) : 0;
    const items: AdminActionItem[] = res.rows.map((row) => ({
      threat: convertToThreat(row),
      systemId: row.system_id ?? null,
      reviewApprovedAt:
        row.review_approved_at != null
          ? Math.round(Number(row.review_approved_at) * 1000)
          : null,
      exported: row.exported ?? false,
      exportLinks: (row.export_links ?? []).map((link: any) => ({
        url: link.url,
        createdBy: link.createdBy,
        createdAt:
          link.createdAt != null
            ? Math.round(Number(link.createdAt) * 1000)
            : 0,
      })),
    }));

    return { total, items };
  }

  /**
   * Update threat fields by id
   * @param id
   * @param fields
   */
  async update(
    modelId: string,
    id: string,
    fields: {
      title?: string;
      description?: string;
      isActionItem?: boolean;
      severity?: ThreatSeverity;
    }
  ) {
    const fieldStatements = [];
    const params = [];
    if (fields.title !== undefined) {
      params.push(fields.title);
      fieldStatements.push(`title = $${params.length}`);
    }
    if (fields.description !== undefined) {
      params.push(fields.description);
      fieldStatements.push(`description = $${params.length}`);
    }
    if (fields.isActionItem !== undefined) {
      params.push(fields.isActionItem);
      fieldStatements.push(`is_action_item = $${params.length}::boolean`);
    }
    if (fields.severity !== undefined) {
      params.push(fields.severity);
      fieldStatements.push(`severity = $${params.length}::varchar`);
    }

    if (params.length === 0) return false;

    params.push(modelId);
    params.push(id);
    const query = `
      UPDATE threats
      SET ${fieldStatements.join(", ")}
      WHERE model_id = $${params.length - 1}::uuid AND id = $${
      params.length
    }::uuid
      RETURNING *;
    `;

    const res = await this.pool.query(query, params);

    if (res.rowCount != null && res.rowCount > 0) {
      this.emit("updated-for", {
        modelId: res.rows[0].model_id,
        componentId: res.rows[0].component_id,
      });
      return convertToThreat(res.rows[0]);
    }
    return false;
  }

  /**
   * Delete threat by model id and component id
   * @param modelId
   * @param componentIds
   * @returns
   */
  async deleteByComponentId(modelId: string, componentIds: string[]) {
    const ids = (await this.list(modelId))
      .filter((c) => componentIds.includes(c.componentId))
      .map((c) => c.id!);
    return this.delete(modelId, ...ids);
  }

  /**
   * Delete the threat object
   * @param {id} id - Threat id to delete
   * @returns {boolean}
   */
  async delete(modelId: string, ...ids: string[]) {
    if (!ids || ids.length === 0) {
      return false;
    }

    const filter = `IN (${ids.map((_, i) => `$${2 + i}::uuid`).join(",")})`;

    const query = `
      UPDATE threats
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE model_id = $1::uuid AND id ${filter}
      RETURNING model_id, component_id, suggestion_id;
   `;

    const queryMitigations = `
      UPDATE mitigations m
      SET deleted_at = CURRENT_TIMESTAMP
      FROM threats t
      WHERE m.threat_id = t.id AND t.model_id = $1::uuid and t.id ${filter}
   `;

    const [result, suggestionIds] = await this.pool.runTransaction(
      async (client) => {
        let suggestionIds: SuggestionID[] = [];

        const res = await client.query(query, [modelId, ...ids]);
        const result = res.rowCount != null && res.rowCount > 0;

        if (result) {
          suggestionIds = res.rows
            .filter((v: any) => v.suggestion_id)
            .map((v: any) => new SuggestionID(v.suggestion_id));

          await client.query(queryMitigations, [modelId, ...ids]);
          this.emit("deleted-for", {
            modelId: res.rows[0].model_id,
            componentId: res.rows[0].component_id,
          });
        }

        return [result, suggestionIds];
      }
    );

    // This runs in a different client and could be problematic.
    const promises = suggestionIds.map((id) =>
      this.dal.suggestionService.setSuggestionStatus(
        modelId,
        id,
        SuggestionStatus.New
      )
    );

    await Promise.all(promises);

    return result;
  }

  async copyThreatsBetweenModels(
    srcModelId: string,
    targetModelId: string,
    uuid: Map<string, string>
  ): Promise<void> {
    const threats = await this.list(srcModelId);

    const queryThreats = `
        INSERT INTO threats ( 
        id, model_id, component_id, title, description, created_by, suggestion_id, is_action_item, severity, created_at
        )
        SELECT $1::uuid as id,
              $2::uuid as model_id,
              $3::uuid as component_id,
              title,
              description,
              created_by,
              $4::text as suggestion_id,
              is_action_item,
              severity,
              created_at
        FROM threats 
        WHERE id = $5::uuid
        AND deleted_at IS NULL;
      `;

    for (const threat of threats) {
      if (!uuid.has(threat.componentId)) {
        // skip, component no longer exists
        continue;
      }

      const newUuid = randomUUID();

      try {
        await this.pool.query(queryThreats, [
          newUuid,
          targetModelId,
          uuid.get(threat.componentId),
          threat.suggestionId
            ? uuid.get(threat.componentId) + "/" + threat.suggestionId.partialId
            : null,
          threat.id,
        ]);
      } catch (ex) {
        // Can happen in the odd case where suggestion_id is not found
        this.log.error(
          `Failed to copy threat ${threat.id} from model ${srcModelId} to model ${targetModelId}: ${ex}`
        );
        continue;
      }

      uuid.set(threat.id!, newUuid);
    }
  }
}

/**
 * Postgres 12.4 implementation for `threats`
 * @module data/threats/postgres
 * @exports threats
 */

import { EventEmitter } from "events";
import { Pool } from "pg";
import { getLogger } from "log4js";
import { SuggestionID } from "../../suggestions/models";
import { DataAccessLayer } from "../dal";
import { SuggestionStatus } from "../suggestions/Suggestion";
import Threat from "./Threat";

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
  return threat;
}

export class ThreatDataService extends EventEmitter {
  constructor(pool: Pool, dal: DataAccessLayer) {
    super();
    this.pool = pool;
    this.dal = dal;
    this.log = getLogger("ThreatDataService");
  }

  private pool: Pool;
  private dal: DataAccessLayer;
  log: any;

  /**
   * Create the threat object
   * @param {Threat} threat - Threat creation object
   * @returns {string}
   */
  async create(threat: Threat) {
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
        is_action_item
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
        is_action_item
      FROM threats
      WHERE model_id = $1::uuid 
      AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const res = await this.pool.query(query, [modelId]);

    if (res.rows.length === 0) {
      return [];
    }

    return res.rows.map((record) => convertToThreat(record));
  }

  async listActionItems(modelId: string) {
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
      is_action_item
    FROM threats
    WHERE model_id = $1::uuid and is_action_item = true
    AND deleted_at IS NULL
    ORDER BY created_at DESC
  `;
    const res = await this.pool.query(query, [modelId]);

    if (res.rows.length === 0) {
      return [];
    }

    return res.rows.map((record) => convertToThreat(record));
  }

  /**
   * Update threat fields by id
   * @param id
   * @param fields
   */
  async update(
    modelId: string,
    id: string,
    fields: { title?: string; description?: string; isActionItem?: boolean }
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

    if (res.rowCount > 0) {
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

    const client = await this.pool.connect();
    let result = false;
    try {
      await client.query("BEGIN");
      const res = await client.query(query, [modelId, ...ids]);
      result = res.rowCount > 0;

      if (result) {
        const suggestionIds = res.rows
          .filter((v: any) => v.suggestion_id)
          .map((v: any) => new SuggestionID(v.suggestion_id));

        // This runs in a different client and could be problematic.
        const promises = suggestionIds.map((id) =>
          this.dal.suggestionService.setSuggestionStatus(
            res.rows[0].model_id,
            id,
            SuggestionStatus.New
          )
        );
        await Promise.all(promises);

        await client.query(queryMitigations, [modelId, ...ids]);
        this.emit("deleted-for", {
          modelId: res.rows[0].model_id,
          componentId: res.rows[0].component_id,
        });
      }
      await client.query("COMMIT");
    } catch (e) {
      this.log.error("Failed to delete threat", e);
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }

    return result;
  }
}

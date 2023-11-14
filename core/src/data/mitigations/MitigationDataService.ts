import log4js from "log4js";
import { EventEmitter } from "node:events";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";
import Mitigation from "./Mitigation.js";

function convertToMitigation(row: any) {
  const mitigation = new Mitigation(
    row.threat_id,
    row.control_id,
    row.created_by
  );
  mitigation.createdAt = row.created_at * 1000;
  mitigation.updatedAt = row.updated_at * 1000;
  return mitigation;
}

export class MitigationDataService extends EventEmitter {
  constructor(private dal: DataAccessLayer) {
    super();
    this.pool = dal.pool;
    this.log = log4js.getLogger("MitigationDataService");
  }
  private pool: GramConnectionPool;
  log: any;

  /**
   * Create a mitigation object
   * @param {Control} control - Control creation object
   * @returns {string}
   */
  async create(mitigation: Mitigation) {
    const { threatId, controlId, createdBy } = mitigation;

    const query = `
      INSERT INTO mitigations (threat_id, control_id, created_by) 
      VALUES ($1::uuid, $2::uuid, $3::varchar)
      ON CONFLICT (threat_id, control_id) DO UPDATE
        SET created_by = $3::varchar, deleted_at = NULL
      RETURNING threat_id, control_id
    `;

    const queryThreats = `
      SELECT model_id, component_id
      FROM threats
      WHERE id = $1::uuid
    `;

    await this.pool.runTransaction(async (client) => {
      await client.query(query, [threatId, controlId, createdBy]);
      const res_threats = await client.query(queryThreats, [threatId]);

      this.emit("updated-for", {
        modelId: res_threats.rows[0].model_id,
        componentId: res_threats.rows[0].component_id,
      });
    });

    return { threatId, controlId };
  }

  /**
   * Retrieve a mitigation object
   * @param {string} threatId - Threat identifier
   * @param {string} controlId - Control identifier
   * @returns {Mitigation}
   */
  async getById(threatId: string, controlId: string) {
    const query = `
      SELECT
        threat_id,
        control_id,
        created_by,
        extract(epoch from created_at) as created_at,
        extract(epoch from updated_at) as updated_at
      FROM mitigations
      WHERE threat_id = $1::uuid
      AND control_id = $2::uuid
      AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;
    const res = await this.pool.query(query, [threatId, controlId]);
    if (res.rows.length === 0) {
      return null;
    }

    return convertToMitigation(res.rows[0]);
  }

  /**
   * Retrieve the mitigations objects
   * @param {string} modelId - Model identifier
   * @returns {Control}
   */
  async list(modelId: string) {
    const query = `
      SELECT 
        mitigations.threat_id,
        mitigations.control_id,
        mitigations.created_by,
        extract(epoch from mitigations.created_at) as created_at,
        extract(epoch from mitigations.updated_at) as updated_at
      FROM mitigations
      INNER JOIN threats ON threats.id = mitigations.threat_id
      WHERE threats.model_id = $1::uuid
      AND mitigations.deleted_at IS NULL
      ORDER BY created_at ASC
    `;
    const res = await this.pool.query(query, [modelId]);

    if (res.rows.length === 0) {
      return [];
    }

    return res.rows.map((record) => convertToMitigation(record));
  }

  /**
   * Delete mitigation object
   * @param {string} threatId - Threat identifier
   * @param {string} controlId - Control identifier
   */
  async delete(threatId: string, controlId: string) {
    const query = `
      WITH rows AS (
        UPDATE mitigations
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE threat_id = $1::uuid 
        AND control_id = $2::uuid
        RETURNING threat_id
      )
      SELECT model_id, component_id
      FROM threats
      INNER JOIN rows
      ON rows.threat_id = threats.id
   `;

    const res = await this.pool.query(query, [threatId, controlId]);

    if (res.rowCount > 0) {
      this.emit("updated-for", {
        modelId: res.rows[0].model_id,
        componentId: res.rows[0].component_id,
      });
      return true;
    }
    return false;
  }
}

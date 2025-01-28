import log4js from "log4js";
import { EventEmitter } from "node:events";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";
import Matching from "./Matching.js";

function convertToMatching(row: any) {
  const matching = new Matching(
    row.model_id,
    row.resource_id,
    row.component_id_by,
    row.created_by
  );
  matching.createdAt = row.created_at * 1000;
  matching.updatedAt = row.updated_at * 1000;
  return matching;
}

export class MatchingDataService extends EventEmitter {
  constructor(private dal: DataAccessLayer) {
    super();
    this.pool = dal.pool;
    this.log = log4js.getLogger("MatchingDataService");
  }
  private pool: GramConnectionPool;
  log: any;

  async create(matching: Matching) {
    const { modelId, resourceId, componentId, createdBy } = matching;
    const query = `
      INSERT INTO resource_matchings (model_id, resource_id, component_id, created_by) 
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4::varchar)
      ON CONFLICT (model_id, resource_id) DO UPDATE
        SET created_by = $4::varchar, deleted_at = NULL
    `;

    const queryMatchings = `
      SELECT model_id, component_id, resource_id
      FROM resource_matchings
      WHERE model_id = $1::uuid AND resource_id = $2::uuid AND component_id = $3::uuid 
    `;

    await this.pool.runTransaction(async (client) => {
      await client.query(query, [modelId, resourceId, componentId, createdBy]);
      const res_matchings = await client.query(queryMatchings, [
        modelId,
        resourceId,
        componentId,
      ]);

      /* 
      For websockets
        this.emit("updated-for", {
        modelId: res_matchings.rows[0].model_id,
        componentId: res_matchings.rows[0].component_id,
      }); */
    });
    return { modelId, resourceId, componentId };
  }

  async delete(matching: Matching) {
    const { modelId, resourceId, componentId, createdBy } = matching;
    const query = `
      UPDATE resource_matchings
      SET deleted_at = NOW()
      SET deleted_by = $4::varchar
      WHERE model_id = $1::uuid AND resource_id = $2::uuid AND component_id = $3::uuid
    `;

    await this.pool.runTransaction(async (client) => {
      await client.query(query, [modelId, resourceId, componentId, createdBy]);
      /* const res_matchings = await client.query(queryMatchings, [
        modelId,
        resourceId,
        componentId,
      ]); */

      /* this.emit("updated-for", {
        modelId: res_matchings.rows[0].model_id,
        componentId: res_matchings.rows[0].component_id,
        resourceId: res_matchings.rows[0].resource_id,
      }); */
    });
    return { modelId, resourceId, componentId };
  }

  async list(modelId: string) {
    const query = `
      SELECT 
        resource_matchings.model_id,
        resource_matchings.resource_id,
        resource_matchings.component_id,
        resource_matchings.created_by,
        extract(epoch from resource_matchings.created_at) as created_at,
        extract(epoch from resource_matchings.updated_at) as updated_at
      FROM resource_matchings
      WHERE model_id = $1::uuid
      AND resource_matchings.deleted_at IS NULL
      ORDER BY created_at ASC
    `;
    const res = await this.pool.query(query, [modelId]);

    if (res.rows.length === 0) {
      return [];
    }

    return res.rows.map((record) => convertToMatching(record));
  }

  async copyMatchingsBetweenModels(srcModelId: string, targetModelId: string) {}
}

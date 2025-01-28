import log4js from "log4js";
import { EventEmitter } from "node:events";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";
import ResourceMatching from "./ResourceMatching.js";

function convertToMatching(row: any) {
  const matching = new ResourceMatching(
    row.model_id,
    row.resource_id,
    row.component_id_by,
    row.created_by
  );
  matching.createdAt = row.created_at * 1000;
  matching.updatedAt = row.updated_at * 1000;
  return matching;
}

export class ResourceMatchingDataService extends EventEmitter {
  constructor(private dal: DataAccessLayer) {
    super();
    this.pool = dal.pool;
    this.log = log4js.getLogger("MatchingDataService");
  }
  private pool: GramConnectionPool;
  log: any;

  async create(matching: ResourceMatching) {
    const { modelId, resourceId, componentId, createdBy } = matching;
    const query = `
      INSERT INTO resource_matchings (model_id, resource_id, component_id, created_by, deleted_at) 
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4::varchar, NULL)
      ON CONFLICT (model_id, resource_id) DO UPDATE
        SET updated_by = $4::varchar, component_id = $3::uuid
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

    const model = await this.dal.modelService.getById(modelId);
    const componentList =
      model?.data.components.map((component) => component.id) || [];

    return res.rows
      .filter((record) => componentList.includes(record.component_id))
      .map((record) => convertToMatching(record));
  }

  async delete(
    modelId: string,
    resourceId: string,
    componentId: string,
    deletedBy: string
  ) {
    const query = `
      UPDATE resource_matchings
      SET deleted_at = NOW(), updated_by = $4::varchar
      WHERE model_id = $1::uuid AND resource_id = $2::uuid AND component_id = $3::uuid
    `;

    await this.pool.runTransaction(async (client) => {
      await client.query(query, [modelId, resourceId, componentId, deletedBy]);
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
  async copyMatchingsBetweenModels(srcModelId: string, targetModelId: string) {}
}

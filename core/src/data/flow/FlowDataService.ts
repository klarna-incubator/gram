import log4js from "log4js";
import { EventEmitter } from "node:events";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";
import { Flow, FlowAttributes } from "./Flow.js";

export class FlowDataService extends EventEmitter {
  constructor(private dal: DataAccessLayer) {
    super();
    this.pool = dal.pool;
  }

  private pool: GramConnectionPool;

  log = log4js.getLogger("FlowDataService");

  async getById(id: number): Promise<Flow | null> {
    const query = `        
        SELECT * FROM flows WHERE id = $1
      `;

    const res = await this.pool.query(query, [id]);
    if (res.rows.length === 0) {
      return null;
    }

    return new Flow(
      res.rows[0].id,
      res.rows[0].model_id,
      res.rows[0].data_flow_id,
      res.rows[0].origin_component_id,
      res.rows[0].summary,
      res.rows[0].attributes,
      res.rows[0].created_by,
      res.rows[0].created_at,
      res.rows[0].updated_at
    );
  }

  async listFlows(modelId: string, dataFlowId: string): Promise<Flow[]> {
    const query = `        
        SELECT * FROM flows WHERE model_id = $1 AND data_flow_id = $2 ORDER BY id ASC
      `;

    const res = await this.pool.query(query, [modelId, dataFlowId]);
    return res.rows.map(
      (row) =>
        new Flow(
          row.id,
          row.model_id,
          row.data_flow_id,
          row.origin_component_id,
          row.summary,
          row.attributes,
          row.created_by,
          row.created_at,
          row.updated_at
        )
    );
  }

  async insertFlow(
    modelId: string,
    dataFlowId: string,
    summary: string,
    originComponentId: string,
    attributes: FlowAttributes,
    createdBy: string
  ): Promise<Flow> {
    const query = `        
        INSERT INTO flows (model_id, data_flow_id, summary, origin_component_id, attributes, created_by) VALUES($1, $2, $3, $4, $5, $6) RETURNING *
      `;

    const res = await this.pool.query(query, [
      modelId,
      dataFlowId,
      summary,
      originComponentId,
      attributes,
      createdBy,
    ]);

    const flow = new Flow(
      res.rows[0].id,
      res.rows[0].model_id,
      res.rows[0].data_flow_id,
      res.rows[0].origin_component_id,
      res.rows[0].summary,
      res.rows[0].attributes,
      res.rows[0].created_by,
      res.rows[0].created_at,
      res.rows[0].updated_at
    );

    this.emit("updated-for", { modelId, dataFlowId });

    return flow;
  }

  async patchFlow(
    id: number,
    summary: string,
    originComponentId: string,
    attributes: FlowAttributes
  ): Promise<void> {
    const query = `        
        UPDATE flows SET summary = $1, origin_component_id = $2, attributes = $3 WHERE id = $4 RETURNING *
      `;
    const res = await this.pool.query(query, [
      summary,
      originComponentId,
      attributes,
      id,
    ]);
    if (res.rowCount !== null && res.rowCount > 0) {
      this.emit("updated-for", {
        modelId: res.rows[0].model_id,
        dataFlowId: res.rows[0].data_flow_id,
      });
    }
  }

  async deleteFlow(id: number): Promise<void> {
    const query = `        
        DELETE FROM flows WHERE id = $1 RETURNING *
      `;
    const res = await this.pool.query(query, [id]);
    if (res.rowCount !== null && res.rowCount > 0) {
      this.emit("updated-for", {
        modelId: res.rows[0].model_id,
        dataFlowId: res.rows[0].data_flow_id,
      });
    }
  }

  async copyFlowsBetweenModels(
    srcModelId: string,
    targetModelId: string,
    uuid: Map<string, string>
  ): Promise<void> {
    // Get flows from source model
    const query = `
      SELECT id, data_flow_id, origin_component_id FROM flows WHERE model_id = $1
    `;
    const res = await this.pool.query(query, [srcModelId]);

    const queryImport = `
    INSERT INTO flows ( 
      id, model_id, data_flow_id, summary,
      origin_component_id, attributes, created_by, created_at, updated_at
    )
    SELECT id, 
          $1 as model_id, 
          $2 as data_flow_id,
          summary,
          $3 as origin_component_id,
          attributes,             
          created_by, 
          created_at, 
          updated_at              
    FROM flows 
    WHERE id = $4 AND model_id = $5 AND data_flow_id = $6
  `;

    for (const row of res.rows) {
      const newDfId = uuid.get(row.data_flow_id);
      if (!newDfId) {
        this.log.warn(`Data flow ${row.data_flow_id} not found in map`);
        continue;
      }
      const newOriginComponentId = uuid.get(row.origin_component_id);
      if (!newOriginComponentId) {
        this.log.warn(
          `Component ID ${row.origin_component_id} not found in map`
        );
        continue;
      }
      await this.pool.query(queryImport, [
        targetModelId,
        newDfId,
        newOriginComponentId,
        row.id,
        srcModelId,
        row.data_flow_id,
      ]);
    }
  }
}

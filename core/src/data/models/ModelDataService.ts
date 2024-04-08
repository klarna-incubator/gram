/**
 * Postgres 12.4 implementation for `models`
 * @module data/models/postgres
 * @exports models
 */

import { randomUUID } from "crypto";
import log4js from "log4js";
import { EventEmitter } from "node:events";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";
import Model, { ModelData } from "./Model.js";
import { LinkObjectType } from "../links/Link.js";

function convertToModel(row: any) {
  const model = new Model(row.system_id, row.version, row.created_by);
  model.id = row.id;
  model.createdAt = row.created_at * 1000;
  model.updatedAt = row.updated_at * 1000;
  model.reviewApprovedAt = row.review_approved_at;
  model.reviewStatus = row.review_status;
  model.isTemplate = row.is_template;
  model.shouldReviewActionItems = row.should_review_action_items;
  if (row.data) model.data = row.data;
  return model;
}

export const ModelFilters = ["user", "recent", "system"];
export enum ModelFilter {
  User = "user",
  Recent = "recent",
  System = "system",
}

export interface ModelListOptions {
  user: string;
  withSystems: boolean;
  systemId?: string;
}

export class ModelDataService extends EventEmitter {
  constructor(private dal: DataAccessLayer) {
    super();
    this.pool = dal.pool;
    this.log = log4js.getLogger("ModelDataService");
  }

  private pool: GramConnectionPool;
  log: any;

  /**
   * Retrieve list of model objects based on filter
   * @param {string} filter - Type of filter to use
   * @param {object} options - Object parameter for a specific filter
   * @returns {array}
   */
  async list(filter: ModelFilter, opts: ModelListOptions) {
    let params: string[] = [];
    let systemClause = "";
    let whereClause = "";
    let joinClause = "";
    let groupClause = "";
    let orderClause = "";

    if (filter === "user") {
      if (opts.user === undefined) {
        throw new Error("Invalid List Options: user undefined");
      }
      params = [opts.user];
      whereClause = "WHERE m.created_by = $1::varchar";
      systemClause =
        opts.withSystems === false ? "AND m.system_id is NULL" : "";
      orderClause = "ORDER BY m.updated_at DESC;";
    }

    if (filter === "recent") {
      params = [opts.user || ""];
      whereClause = "WHERE ua.user_id = $1::varchar";
      joinClause = "INNER JOIN user_activity ua ON m.id = ua.model_id";
      groupClause = "GROUP BY m.id, r.status, r.approved_at";
      systemClause =
        opts.withSystems === false ? "AND m.system_id is NULL" : "";
      orderClause = "ORDER BY MAX(ua.created_at) DESC;";
    }

    if (filter === "system") {
      params = [opts.systemId as string];
      whereClause = "WHERE m.system_id = $1::varchar";
      orderClause = "ORDER BY m.updated_at DESC;";
    }

    const query = `
      SELECT
        m.id as id,
        m.system_id as system_id,
        m.version as version,
        m.created_by as created_by,
        r.status as review_status,
        r.approved_at as review_approved_at,
        extract(epoch from m.created_at) as created_at,
        extract(epoch from m.updated_at) as updated_at,
        is_template
      FROM models m
      LEFT JOIN reviews r ON r.model_id = m.id AND r.deleted_at IS NULL
      ${joinClause}
      ${whereClause}
      AND m.deleted_at is NULL
      ${systemClause}
      ${groupClause}
      ${orderClause}
    `;
    const res = await this.pool.query(query, params);
    return res.rows.map(convertToModel);
  }

  /**
   * Retrieve the model object of specified id
   * @param {string} id - System identifier
   * @returns {Model}
   */
  async getById(id: string) {
    const query = `
      SELECT
        id,
        system_id,
        version,
        data,
        created_by,
        extract(epoch from created_at) as created_at,
        extract(epoch from updated_at) as updated_at,
        is_template,
        should_review_action_items
      FROM models
      WHERE id = $1::uuid
      AND deleted_at IS NULL
    `;
    const res = await this.pool.query(query, [id]);

    if (res.rows.length === 0) {
      return null;
    }

    return convertToModel(res.rows[0]);
  }

  async getTemplates() {
    const query = `
    SELECT
      id,
      version
    FROM models
    WHERE is_template = true
    AND deleted_at IS NULL
    ORDER BY version ASC
    `;
    const res = await this.pool.query(query);

    if (res.rows.length === 0) {
      return [];
    }

    return res.rows.map((row) => {
      return { id: row.id, version: row.version };
    });
  }

  /**
   * Create a model object of specified id
   * @param {Model} model - Model creation object
   * @param {string | null} srcModelId - Source model for create new model
   * @returns {string}
   */
  async create(
    model: Model,
    createdFrom: string | null = null
  ): Promise<string> {
    const query = `
     INSERT INTO models (system_id, version, data, created_by, created_from, should_review_action_items)
     VALUES ($1::varchar, $2::varchar, $3::json, $4::varchar, $5, $6::boolean)
     RETURNING id;
    `;
    const res = await this.pool.query(query, [
      model.systemId,
      model.version,
      JSON.stringify(model.data),
      model.createdBy,
      createdFrom,
      model.shouldReviewActionItems,
    ]);

    this.emit("updated-for", { modelId: res.rows[0].id });

    return res.rows[0].id;
  }

  async copy(srcModelId: string, targetModel: Model) {
    const srcModel = await this.getById(srcModelId);

    if (!srcModel) {
      return null;
    }

    const uuid: Map<string, string> = new Map();
    targetModel.data.components = srcModel.data.components.map((c) => {
      const newId = randomUUID();
      uuid.set(c.id, newId);
      return { ...c, id: newId };
    });

    targetModel.data.dataFlows = srcModel.data.dataFlows.map((c) => {
      const newId = randomUUID();
      uuid.set(c.id, newId);
      const startComponentId = uuid.get(c.startComponent.id);
      const endComponentId = uuid.get(c.endComponent.id);
      if (!startComponentId || !endComponentId) {
        throw new Error(
          `Failed to rebind dataflow component ids ${JSON.stringify({
            srcModelId,
            targetModelId: targetModel.id,
            originalStartComponentId: c.startComponent.id,
            originalEndComponentId: c.endComponent.id,
            startComponentId,
            endComponentId,
          })}`
        );
      }
      return {
        ...c,
        id: newId,
        startComponent: { id: startComponentId },
        endComponent: { id: endComponentId },
      };
    });

    const threats = await this.dal.threatService.list(srcModel.id!);
    const controls = await this.dal.controlService.list(srcModel.id!);
    const mitigations = await this.dal.mitigationService.list(srcModel.id!);

    targetModel.shouldReviewActionItems =
      threats.filter((t) => t.isActionItem).length > 0;

    const targetModelId = await this.create(targetModel, srcModelId);
    uuid.set(srcModel.id!, targetModelId);

    await this.dal.suggestionService.copySuggestions(
      srcModel.id!,
      targetModelId,
      uuid
    );

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

    const queryLinks = `
        INSERT INTO links ( 
          id, object_type, object_id, icon, url, label, created_by, created_at, updated_at
        )
        SELECT id, 
               object_type, 
               $1 as object_id, 
               icon, 
               url, 
               label, 
               created_by, 
               created_at, 
               updated_at              
        FROM links 
        WHERE object_type = $3 AND object_id = $2;        
      `;

    const queryControls = `
        INSERT INTO controls ( 
        id, model_id, component_id, title, description, in_place, created_by, suggestion_id, created_at
        )
        SELECT $1::uuid as id ,
              $2::uuid as model_id,
              $3::uuid as component_id,
              title,
              description,
              in_place,
              created_by,
              $4::text as suggestion_id,
              created_at
        FROM controls 
        WHERE id = $5::uuid
        AND deleted_at IS NULL;
      `;

    const queryMitigations = `
        INSERT INTO mitigations ( 
        threat_id, control_id, created_by
        )
        SELECT $1::uuid as threat_id,
              $2::uuid as control_id,
              created_by
        FROM mitigations
        WHERE threat_id = $3::uuid
        AND control_id = $4::uuid
        AND deleted_at IS NULL;
      `;

    const anyInvalidUuid = (...uuids: string[]) =>
      uuids.reduce((p: boolean, c) => p || !uuid.has(c), false);

    await this.pool.runTransaction(async (client) => {
      for (const threat of threats) {
        uuid.set(threat.id!, randomUUID());
        if (anyInvalidUuid(threat.id!, threat.componentId)) {
          // skip, component or threat no longer exists
          continue;
        }
        await client.query(queryThreats, [
          uuid.get(threat.id!),
          uuid.get(srcModel.id!),
          uuid.get(threat.componentId),
          threat.suggestionId
            ? uuid.get(threat.componentId) + "/" + threat.suggestionId.partialId
            : null,
          threat.id,
        ]);

        await client.query(queryLinks, [
          uuid.get(threat.id!),
          threat.id,
          LinkObjectType.Threat,
        ]);
      }

      for (const control of controls) {
        uuid.set(control.id!, randomUUID());
        if (anyInvalidUuid(control.id!, control.componentId)) {
          // skip, component or threat no longer exists
          continue;
        }
        await client.query(queryControls, [
          uuid.get(control.id!),
          uuid.get(srcModel.id!),
          uuid.get(control.componentId),
          control.suggestionId
            ? uuid.get(control.componentId) +
              "/" +
              control.suggestionId.partialId
            : null,
          control.id,
        ]);

        await client.query(queryLinks, [
          uuid.get(control.id!),
          control.id,
          LinkObjectType.Control,
        ]);
      }

      for (const mitigation of mitigations) {
        if (anyInvalidUuid(mitigation.threatId, mitigation.controlId)) {
          // skip, component or threat no longer exists
          continue;
        }
        await client.query(queryMitigations, [
          uuid.get(mitigation.threatId),
          uuid.get(mitigation.controlId),
          mitigation.threatId,
          mitigation.controlId,
        ]);
      }

      await client.query(queryLinks, [
        uuid.get(srcModel.id!),
        srcModel.id,
        LinkObjectType.Model,
      ]);
    });

    this.emit("updated-for", { modelId: uuid.get(srcModel.id!) });

    return uuid.get(srcModel.id!) as string;
  }

  /**
   * Delete model by id
   * @param {string} id
   */
  async delete(id: string) {
    const queryThreats = `
      UPDATE threats
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE model_id = $1::uuid
      RETURNING id
   `;

    const queryControls = `
      UPDATE controls
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE model_id = $1::uuid
      RETURNING id
   `;

    const queryMitigations = `
      UPDATE mitigations
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE threat_id = ANY($1::uuid[])
      OR control_id = ANY($2::uuid[])
   `;

    const query = `
      UPDATE models
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1::uuid
      RETURNING id
    `;
    let success = false;
    const res = await this.pool.runTransaction(async (client) => {
      const threats = await client.query(queryThreats, [id]);

      const controls = await client.query(queryControls, [id]);

      const threatIds = threats.rows.map((t) => t.id);
      const controlIds = controls.rows.map((c) => c.id);
      await client.query(queryMitigations, [threatIds, controlIds]);

      const res = await client.query(query, [id]);
      return res;
    });

    if (res.rowCount > 0) {
      this.emit("updated-for", { modelId: id });
      success = true;
    }

    return success;
  }

  /**
   * Update the model object of specified id
   * @param {string} id - Model id to update
   * @param {any} model - Model object to save
   * @returns {boolean} - true if an update was performed
   */
  async update(id: string, model: { version: string; data: ModelData }) {
    const previousModel = await this.getById(id);
    if (!previousModel) {
      this.log.warn(`Attempted to update non-existent model: ${id}`);
      return false;
    }

    const query = `
     UPDATE models
     SET version = $2::varchar, data = $3::json
     WHERE id = $1::uuid;
    `;
    const res = await this.pool.query(query, [
      id,
      model.version,
      JSON.stringify(model.data),
    ]);

    // If a component has been deleted, we clean up any resources that are connected to
    // that component-id. Ugly, but since we don't have any reference to components
    // outside of the model data, this will have to do for now. (Technically we could spy on
    // the websockets DELETE_NODE events, but this keeps things somewhat "atomic")
    const componentsInNew = new Set(model.data.components.map((c) => c.id));
    const deletedComponents = previousModel.data.components
      .map((c) => c.id)
      .filter((cid) => !componentsInNew.has(cid));
    if (deletedComponents) {
      this.log.debug(
        `Detected that ${deletedComponents.length} component(s) were deleted`
      );
      await Promise.all([
        this.dal.controlService.deleteByComponentId(id, deletedComponents),
        this.dal.threatService.deleteByComponentId(id, deletedComponents),
        this.dal.suggestionService.deleteByComponentId(id, deletedComponents),
      ]);
    }

    this.emit("updated-for", { modelId: id });

    return res.rowCount > 0;
  }

  async setSystemId(modelId: string, systemId: string | null) {
    const res = await this.pool.query(
      "UPDATE models SET system_id = $2::varchar WHERE id = $1::uuid",
      [modelId, systemId]
    );
    this.emit("updated-for", { modelId });
    return res.rowCount === 1;
  }

  async setTemplate(modelId: string, isTemplate: boolean) {
    const res = await this.pool.query(
      "UPDATE models SET is_template = $2::boolean WHERE id = $1::uuid",
      [modelId, isTemplate]
    );
    this.emit("updated-for", { modelId });
    return res.rowCount === 1;
  }

  async setShouldReviewActionItems(
    modelId: string,
    shouldReviewActionItems: boolean
  ) {
    const res = await this.pool.query(
      "UPDATE models SET should_review_action_items = $2::boolean WHERE id = $1::uuid",
      [modelId, shouldReviewActionItems]
    );
    this.emit("updated-for", { modelId });
    return res.rowCount === 1;
  }

  async logAction(userId: string, modelId: string, action: string) {
    const insertQuery = `
      INSERT INTO user_activity (user_id, model_id, action_type)
      VALUES ($1::varchar, $2::uuid, $3::varchar)
      ON CONFLICT (user_id, model_id, action_type) DO UPDATE
        SET created_at = current_timestamp
      RETURNING id;
    `;

    const deleteQuery = `
      DELETE FROM user_activity
      WHERE user_id = $1::varchar
      AND model_id NOT IN (
        SELECT model_id
        FROM user_activity
        WHERE user_id = $1::varchar
        GROUP BY model_id
        ORDER BY max(created_at) DESC        
        LIMIT 8
      );
    `;

    const insertRes = await this.pool.runTransaction(async (client) => {
      const insertRes = await client.query(insertQuery, [
        userId,
        modelId,
        action,
      ]);
      await client.query(deleteQuery, [userId]);
      return insertRes;
    });

    return insertRes?.rows[0]?.id;
  }
}

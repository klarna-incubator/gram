"use strict";
/**
 * Postgres 12.4 implementation for `models`
 * @module data/models/postgres
 * @exports models
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelDataService = exports.ModelFilter = exports.ModelFilters = void 0;
const crypto_1 = require("crypto");
const events_1 = __importDefault(require("events"));
const logger_1 = require("../../logger");
const Model_1 = __importDefault(require("./Model"));
function convertToModel(row) {
    const model = new Model_1.default(row.system_id, row.version, row.created_by);
    model.id = row.id;
    model.createdAt = row.created_at * 1000;
    model.updatedAt = row.updated_at * 1000;
    model.reviewApprovedAt = row.review_approved_at;
    model.reviewStatus = row.review_status;
    model.isTemplate = row.is_template;
    if (row.data)
        model.data = row.data;
    return model;
}
exports.ModelFilters = ["user", "recent", "system"];
var ModelFilter;
(function (ModelFilter) {
    ModelFilter["User"] = "user";
    ModelFilter["Recent"] = "recent";
    ModelFilter["System"] = "system";
})(ModelFilter = exports.ModelFilter || (exports.ModelFilter = {}));
class ModelDataService extends events_1.default {
    constructor(pool, dal) {
        super();
        this.dal = dal;
        this.pool = pool;
        this.log = (0, logger_1.getLogger)("ModelDataService");
    }
    /**
     * Retrieve list of model objects based on filter
     * @param {string} filter - Type of filter to use
     * @param {object} options - Object parameter for a specific filter
     * @returns {array}
     */
    list(filter, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = [];
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
                    opts.withSystems === false
                        ? "AND m.system_id = '00000000-0000-0000-0000-000000000000'"
                        : "";
                orderClause = "ORDER BY m.updated_at DESC;";
            }
            if (filter === "recent") {
                params = [opts.user || ""];
                whereClause = "WHERE ua.user_id = $1::varchar";
                joinClause = "INNER JOIN user_activity ua ON m.id = ua.model_id";
                groupClause = "GROUP BY m.id, r.status, r.approved_at";
                systemClause =
                    opts.withSystems === false
                        ? "AND m.system_id = '00000000-0000-0000-0000-000000000000'"
                        : "";
                orderClause = "ORDER BY MAX(ua.created_at) DESC;";
            }
            if (filter === "system") {
                params = [opts.systemId || "00000000-0000-0000-0000-000000000000"];
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
            const res = yield this.pool.query(query, params);
            return res.rows.map(convertToModel);
        });
    }
    /**
     * Retrieve the model object of specified id
     * @param {string} id - System identifier
     * @returns {Model}
     */
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT
        id,
        system_id,
        version,
        data,
        created_by,
        extract(epoch from created_at) as created_at,
        extract(epoch from updated_at) as updated_at,
        is_template
      FROM models
      WHERE id = $1::uuid
      AND deleted_at IS NULL
    `;
            const res = yield this.pool.query(query, [id]);
            if (res.rows.length === 0) {
                return null;
            }
            return convertToModel(res.rows[0]);
        });
    }
    getTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
    SELECT
      id,
      version
    FROM models
    WHERE is_template = true
    AND deleted_at IS NULL
    ORDER BY version ASC
    `;
            const res = yield this.pool.query(query);
            if (res.rows.length === 0) {
                return [];
            }
            return res.rows.map((row) => {
                return { id: row.id, version: row.version };
            });
        });
    }
    /**
     * Create a model object of specified id
     * @param {Model} model - Model creation object
     * @param {string | null} srcModelId - Source model for create new model
     * @returns {string}
     */
    create(model, createdFrom = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
     INSERT INTO models (system_id, version, data, created_by, created_from)
     VALUES ($1::varchar, $2::varchar, $3::json, $4::varchar, $5)
     RETURNING id;
    `;
            const res = yield this.pool.query(query, [
                model.systemId,
                model.version,
                JSON.stringify(model.data),
                model.createdBy,
                createdFrom,
            ]);
            this.emit("updated-for", { modelId: res.rows[0].id });
            return res.rows[0].id;
        });
    }
    copy(srcModelId, targetModel) {
        return __awaiter(this, void 0, void 0, function* () {
            const srcModel = yield this.getById(srcModelId);
            if (!srcModel) {
                return null;
            }
            const uuid = {};
            targetModel.data.components = srcModel.data.components.map((c) => {
                const newId = (0, crypto_1.randomUUID)();
                uuid[c.id] = newId;
                return Object.assign(Object.assign({}, c), { id: newId });
            });
            targetModel.data.dataFlows = srcModel.data.dataFlows.map((c) => {
                const newId = (0, crypto_1.randomUUID)();
                uuid[c.id] = newId;
                return Object.assign(Object.assign({}, c), { id: newId, startComponent: { id: uuid[c.startComponent.id] }, endComponent: { id: uuid[c.endComponent.id] } });
            });
            uuid[srcModel.id] = yield this.create(targetModel, srcModelId);
            const threats = yield this.dal.threatService.list(srcModel.id);
            const controls = yield this.dal.controlService.list(srcModel.id);
            const mitigations = yield this.dal.mitigationService.list(srcModel.id);
            const queryThreats = `
        INSERT INTO threats ( 
        id, model_id, component_id, title, description, created_by, suggestion_id
        )
        SELECT $1::uuid as id,
              $2::uuid as model_id,
              $3::uuid as component_id,
              title,
              description,
              created_by,
              suggestion_id
        FROM threats 
        WHERE id = $4::uuid
        AND deleted_at IS NULL;
      `;
            const queryControls = `
        INSERT INTO controls ( 
        id, model_id, component_id, title, description, in_place, created_by, suggestion_id
        )
        SELECT $1::uuid as id ,
              $2::uuid as model_id,
              $3::uuid as component_id,
              title,
              description,
              in_place,
              created_by,
              suggestion_id
        FROM controls 
        WHERE id = $4::uuid
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
            const client = yield this.pool.connect();
            try {
                yield client.query("BEGIN");
                for (const threat of threats) {
                    uuid[threat.id] = (0, crypto_1.randomUUID)();
                    yield client.query(queryThreats, [
                        uuid[threat.id],
                        uuid[srcModel.id],
                        uuid[threat.componentId],
                        threat.id,
                    ]);
                }
                for (const control of controls) {
                    uuid[control.id] = (0, crypto_1.randomUUID)();
                    yield client.query(queryControls, [
                        uuid[control.id],
                        uuid[srcModel.id],
                        uuid[control.componentId],
                        control.id,
                    ]);
                }
                for (const mitigation of mitigations) {
                    yield client.query(queryMitigations, [
                        uuid[mitigation.threatId],
                        uuid[mitigation.controlId],
                        mitigation.threatId,
                        mitigation.controlId,
                    ]);
                }
                yield client.query("COMMIT");
                this.emit("updated-for", { modelId: uuid[srcModel.id] });
            }
            catch (e) {
                yield client.query("ROLLBACK");
                this.log.error("Failed to copy model", e);
            }
            finally {
                client.release();
            }
            return uuid[srcModel.id];
        });
    }
    /**
     * Delete model by id
     * @param {string} id
     */
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const client = yield this.pool.connect();
            try {
                yield client.query("BEGIN");
                const threats = yield client.query(queryThreats, [id]);
                const controls = yield client.query(queryControls, [id]);
                const threatIds = threats.rows.map((t) => t.id);
                const controlIds = controls.rows.map((c) => c.id);
                yield client.query(queryMitigations, [threatIds, controlIds]);
                const res = yield client.query(query, [id]);
                yield client.query("COMMIT");
                if (res.rowCount > 0) {
                    this.emit("updated-for", { modelId: id });
                    success = true;
                }
            }
            catch (e) {
                yield client.query("ROLLBACK");
                this.log.error("Failed to delete model", e);
            }
            finally {
                client.release();
            }
            return success;
        });
    }
    /**
     * Update the model object of specified id
     * @param {string} id - Model id to update
     * @param {any} model - Model object to save
     * @returns {boolean} - true if an update was performed
     */
    update(id, model) {
        return __awaiter(this, void 0, void 0, function* () {
            const previousModel = yield this.getById(id);
            if (!previousModel) {
                this.log.warn(`Attempted to update non-existent model: ${id}`);
                return false;
            }
            const query = `
     UPDATE models
     SET version = $2::varchar, data = $3::json
     WHERE id = $1::uuid;
    `;
            const res = yield this.pool.query(query, [
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
                this.log.debug(`Detected that ${deletedComponents.length} component(s) were deleted`);
                yield Promise.all([
                    this.dal.controlService.deleteByComponentId(id, deletedComponents),
                    this.dal.threatService.deleteByComponentId(id, deletedComponents),
                    this.dal.suggestionService.deleteByComponentId(id, deletedComponents),
                ]);
            }
            this.emit("updated-for", { modelId: id });
            return res.rowCount > 0;
        });
    }
    setTemplate(modelId, isTemplate) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.pool.query("UPDATE models SET is_template = $2::boolean WHERE id = $1::uuid", [modelId, isTemplate]);
            this.emit("updated-for", { modelId });
            return res.rowCount === 1;
        });
    }
    logAction(userId, modelId, action) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
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
            const client = yield this.pool.connect();
            let insertRes = null;
            try {
                yield client.query("BEGIN");
                insertRes = yield client.query(insertQuery, [userId, modelId, action]);
                yield client.query(deleteQuery, [userId]);
                yield client.query("COMMIT");
            }
            catch (e) {
                yield client.query("ROLLBACK");
                this.log.error("Failed to log action", e);
            }
            finally {
                client.release();
            }
            return (_a = insertRes === null || insertRes === void 0 ? void 0 : insertRes.rows[0]) === null || _a === void 0 ? void 0 : _a.id;
        });
    }
}
exports.ModelDataService = ModelDataService;
//# sourceMappingURL=ModelDataService.js.map
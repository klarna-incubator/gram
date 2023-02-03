"use strict";
/**
 * Postgres 12.4 implementation for `threats`
 * @module data/threats/postgres
 * @exports threats
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
exports.ThreatDataService = exports.convertToThreat = void 0;
const events_1 = require("events");
const logger_1 = require("../../logger");
const models_1 = require("../../suggestions/models");
const Suggestion_1 = require("../suggestions/Suggestion");
const Threat_1 = __importDefault(require("./Threat"));
function convertToThreat(row) {
    const threat = new Threat_1.default(row.title, row.description, row.model_id, row.component_id, row.created_by, row.suggestion_id ? new models_1.SuggestionID(row.suggestion_id) : undefined);
    threat.id = row.id;
    threat.createdAt = row.created_at * 1000;
    threat.updatedAt = row.updated_at * 1000;
    threat.isActionItem = row.is_action_item || false;
    return threat;
}
exports.convertToThreat = convertToThreat;
class ThreatDataService extends events_1.EventEmitter {
    constructor(pool, dal) {
        super();
        this.pool = pool;
        this.dal = dal;
        this.log = (0, logger_1.getLogger)("ThreatDataService");
    }
    /**
     * Create the threat object
     * @param {Threat} threat - Threat creation object
     * @returns {string}
     */
    create(threat) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
     INSERT INTO threats (title, description, model_id, component_id, created_by, suggestion_id)
     VALUES ($1::varchar, $2::varchar, $3::uuid, $4::uuid, $5::varchar, $6)
     RETURNING id;
    `;
            const { title, description, modelId, componentId, createdBy, suggestionId, } = threat;
            const res = yield this.pool.query(query, [
                title,
                description,
                modelId,
                componentId,
                createdBy,
                suggestionId === null || suggestionId === void 0 ? void 0 : suggestionId.val,
            ]);
            this.emit("updated-for", { modelId, componentId });
            return res.rows[0].id;
        });
    }
    /**
     * Retrieve a threat object
     * @param {string} id - Threat identifier
     * @returns {Threat}
     */
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const res = yield this.pool.query(query, [id]);
            if (res.rows.length === 0) {
                return null;
            }
            return convertToThreat(res.rows[0]);
        });
    }
    /**
     * Retrieve the threat object
     * @param {string} modelId - Model system identifier
     * @returns {[Threat]}
     */
    list(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const res = yield this.pool.query(query, [modelId]);
            if (res.rows.length === 0) {
                return [];
            }
            return res.rows.map((record) => convertToThreat(record));
        });
    }
    listActionItems(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const res = yield this.pool.query(query, [modelId]);
            if (res.rows.length === 0) {
                return [];
            }
            return res.rows.map((record) => convertToThreat(record));
        });
    }
    /**
     * Update threat fields by id
     * @param id
     * @param fields
     */
    update(modelId, id, fields) {
        return __awaiter(this, void 0, void 0, function* () {
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
            if (params.length === 0)
                return false;
            params.push(modelId);
            params.push(id);
            const query = `
      UPDATE threats
      SET ${fieldStatements.join(", ")}
      WHERE model_id = $${params.length - 1}::uuid AND id = $${params.length}::uuid
      RETURNING *;
    `;
            const res = yield this.pool.query(query, params);
            if (res.rowCount > 0) {
                this.emit("updated-for", {
                    modelId: res.rows[0].model_id,
                    componentId: res.rows[0].component_id,
                });
                return convertToThreat(res.rows[0]);
            }
            return false;
        });
    }
    /**
     * Delete threat by model id and component id
     * @param modelId
     * @param componentIds
     * @returns
     */
    deleteByComponentId(modelId, componentIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = (yield this.list(modelId))
                .filter((c) => componentIds.includes(c.componentId))
                .map((c) => c.id);
            return this.delete(modelId, ...ids);
        });
    }
    /**
     * Delete the threat object
     * @param {id} id - Threat id to delete
     * @returns {boolean}
     */
    delete(modelId, ...ids) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const client = yield this.pool.connect();
            let result = false;
            try {
                yield client.query("BEGIN");
                const res = yield client.query(query, [modelId, ...ids]);
                result = res.rowCount > 0;
                if (result) {
                    const suggestionIds = res.rows
                        .filter((v) => v.suggestion_id)
                        .map((v) => new models_1.SuggestionID(v.suggestion_id));
                    // This runs in a different client and could be problematic.
                    const promises = suggestionIds.map((id) => this.dal.suggestionService.setSuggestionStatus(res.rows[0].model_id, id, Suggestion_1.SuggestionStatus.New));
                    yield Promise.all(promises);
                    yield client.query(queryMitigations, [modelId, ...ids]);
                    this.emit("deleted-for", {
                        modelId: res.rows[0].model_id,
                        componentId: res.rows[0].component_id,
                    });
                }
                yield client.query("COMMIT");
            }
            catch (e) {
                this.log.error("Failed to delete threat", e);
                yield client.query("ROLLBACK");
            }
            finally {
                client.release();
            }
            return result;
        });
    }
}
exports.ThreatDataService = ThreatDataService;
//# sourceMappingURL=ThreatDataService.js.map
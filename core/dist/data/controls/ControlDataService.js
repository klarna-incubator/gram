"use strict";
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
exports.ControlDataService = exports.convertToControl = void 0;
const events_1 = require("events");
const logger_1 = require("../../logger");
const models_1 = require("../../suggestions/models");
const Suggestion_1 = require("../suggestions/Suggestion");
const Control_1 = __importDefault(require("./Control"));
function convertToControl(row) {
    const control = new Control_1.default(row.title, row.description, row.in_place, row.model_id, row.component_id, row.created_by, row.suggestion_id ? new models_1.SuggestionID(row.suggestion_id) : undefined);
    control.id = row.id;
    control.createdAt = row.created_at * 1000;
    control.updatedAt = row.updated_at * 1000;
    return control;
}
exports.convertToControl = convertToControl;
class ControlDataService extends events_1.EventEmitter {
    constructor(pool, dal) {
        super();
        this.pool = pool;
        this.dal = dal;
        this.log = (0, logger_1.getLogger)("ControlDataService");
    }
    /**
     * Create a control object of specified id
     * @param {Control} control - Control creation object
     * @returns {string}
     */
    create(control) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      INSERT INTO controls (
        title, in_place, model_id, component_id, created_by, suggestion_id, description
      )
      VALUES (
        $1::varchar, $2::bool, $3::uuid, $4::uuid, $5::varchar, $6, $7::varchar
      )
      RETURNING id;
    `;
            const { title, inPlace, modelId, componentId, createdBy, suggestionId, description, } = control;
            const res = yield this.pool.query(query, [
                title,
                inPlace,
                modelId,
                componentId,
                createdBy,
                suggestionId === null || suggestionId === void 0 ? void 0 : suggestionId.val,
                description,
            ]);
            this.emit("updated-for", { modelId, componentId });
            return res.rows[0].id;
        });
    }
    /**
     * Retrieve a control object
     * @param {string} id - Control identifier
     * @returns {Control}
     */
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT
        id,
        title,
        description,
        in_place,
        model_id,
        component_id,
        suggestion_id,
        created_by,
        extract(epoch from created_at) as created_at,
        extract(epoch from updated_at) as updated_at
      FROM controls
      WHERE id = $1::uuid
      AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;
            const res = yield this.pool.query(query, [id]);
            if (res.rows.length === 0) {
                return null;
            }
            return convertToControl(res.rows[0]);
        });
    }
    /**
     * Retrieve the controls objects
     * @param {string} modelId - Model identifier
     * @returns {Control}
     */
    list(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT
        id,
        title,
        description,
        in_place,
        model_id,
        component_id,
        suggestion_id,
        created_by,
        extract(epoch from created_at) as created_at,
        extract(epoch from updated_at) as updated_at
      FROM controls
      WHERE model_id = $1::uuid
      AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
            const res = yield this.pool.query(query, [modelId]);
            if (res.rows.length === 0) {
                return [];
            }
            return res.rows.map((record) => convertToControl(record));
        });
    }
    /**
     * Delete control by model id and component id
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
     * Delete control by id(s)
     * @param id
     */
    delete(modelId, ...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ids || ids.length === 0) {
                return false;
            }
            const filter = `IN (${ids.map((_, i) => `$${2 + i}::uuid`).join(",")})`;
            const query = `
      UPDATE controls
      SET deleted_at = CURRENT_TIMESTAMP      
      WHERE model_id = $1::uuid AND id ${filter}
      RETURNING model_id, component_id, suggestion_id
   `;
            const queryMitigations = `
      UPDATE mitigations m
      SET deleted_at = CURRENT_TIMESTAMP
      FROM controls c      
      WHERE c.model_id = $1::uuid AND m.control_id = c.id AND c.id ${filter}      
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
                    const promises = suggestionIds.map((id) => this.dal.suggestionService.setSuggestionStatus(modelId, id, Suggestion_1.SuggestionStatus.New));
                    yield Promise.all(promises);
                    yield client.query(queryMitigations, [modelId, ...ids]);
                    this.emit("deleted-for", {
                        modelId: modelId,
                        componentId: res.rows[0].component_id,
                    });
                }
                yield client.query("COMMIT");
            }
            catch (e) {
                this.log.error("Failed to delete control", e);
                yield client.query("ROLLBACK");
            }
            finally {
                client.release();
            }
            return result;
        });
    }
    /**
     * Update control fields by id
     * @param id
     * @param fields
     */
    update(modelId, id, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            const fieldStatements = [];
            const params = [];
            if (fields.inPlace !== undefined) {
                params.push(fields.inPlace);
                fieldStatements.push(`in_place = $${params.length}`);
            }
            if (fields.title !== undefined) {
                params.push(fields.title);
                fieldStatements.push(`title = $${params.length}`);
            }
            if (fields.description !== undefined) {
                params.push(fields.description);
                fieldStatements.push(`description = $${params.length}`);
            }
            if (params.length === 0)
                return false;
            params.push(modelId);
            params.push(id);
            const query = `
      UPDATE controls
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
                return convertToControl(res.rows[0]);
            }
            return false;
        });
    }
}
exports.ControlDataService = ControlDataService;
//# sourceMappingURL=ControlDataService.js.map
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
exports.SuggestionDataService = void 0;
const events_1 = require("events");
const logger_1 = require("../../logger");
const models_1 = require("../../suggestions/models");
const Control_1 = __importDefault(require("../controls/Control"));
const ControlDataService_1 = require("../controls/ControlDataService");
const Mitigation_1 = __importDefault(require("../mitigations/Mitigation"));
const Threat_1 = __importDefault(require("../threats/Threat"));
const ThreatDataService_1 = require("../threats/ThreatDataService");
const Suggestion_1 = require("./Suggestion");
function convertToSuggestionControl(row) {
    const control = new Suggestion_1.SuggestedControl(new models_1.SuggestionID(row["id"]), row["model_id"], row["component_id"], row["source"]);
    control.description = row["description"];
    control.mitigates = row["mitigates"];
    control.reason = row["reason"];
    control.status = row["status"];
    control.title = row["title"];
    return control;
}
function convertToSuggestionThreat(row) {
    const threat = new Suggestion_1.SuggestedThreat(new models_1.SuggestionID(row["id"]), row["model_id"], row["component_id"], row["source"]);
    threat.description = row["description"];
    threat.reason = row["reason"];
    threat.status = row["status"];
    threat.title = row["title"];
    return threat;
}
class SuggestionDataService extends events_1.EventEmitter {
    constructor(pool, dal) {
        super();
        this.pool = pool;
        this.dal = dal;
        this.log = (0, logger_1.getLogger)("SuggestionDataService");
    }
    /**
     * Insert a list of Threat and Control Suggestions, intended to be used by the SuggestionEngine.
     * @param modelId
     * @param suggestions
     */
    bulkInsert(modelId, suggestions) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(`Got suggestions from engine: ${JSON.stringify(suggestions, null, 2)}`);
            const threatQuery = `
    INSERT INTO suggested_threats (id, model_id, status, component_id, title, description, reason, source)
    VALUES ($1::varchar, $2::uuid, $3::varchar, $4::uuid, $5::varchar, $6::varchar, $7::varchar, $8::varchar)
    ON CONFLICT (id) DO
       UPDATE SET title = $5::varchar, description = $6::varchar, reason = $7::varchar;
   `;
            const controlQuery = `
    INSERT INTO suggested_controls (id, model_id, status, component_id, title, description, reason, mitigates, source)
    VALUES ($1::varchar, $2::uuid, $3::varchar, $4::uuid, $5::varchar, $6::varchar, $7::varchar, $8::json, $9::varchar)
    ON CONFLICT (id) DO
      UPDATE SET title = $5::varchar, description = $6::varchar, reason = $7::varchar, mitigates = $8::json;
   `;
            const deleteThreatsQuery = `
    DELETE FROM suggested_threats WHERE source = $1::varchar and model_id = $2::uuid and status = 'new';
   `;
            const deleteControlsQuery = `
    DELETE FROM suggested_controls WHERE source = $1::varchar and model_id = $2::uuid and status = 'new';
   `;
            const client = yield this.pool.connect();
            try {
                yield client.query("BEGIN");
                // Clear previous batches from this source
                yield client.query(deleteControlsQuery, [
                    suggestions.sourceSlug,
                    modelId,
                ]);
                yield client.query(deleteThreatsQuery, [suggestions.sourceSlug, modelId]);
                let bulkThreats = [];
                if (suggestions.threats.length > 0) {
                    bulkThreats = suggestions.threats.map((threat) => client.query(threatQuery, [
                        threat.id.val,
                        modelId,
                        Suggestion_1.SuggestionStatus.New,
                        threat.componentId,
                        threat.title,
                        threat.description,
                        threat.reason,
                        suggestions.sourceSlug,
                    ]));
                }
                let bulkControls = [];
                if (suggestions.controls.length > 0) {
                    bulkControls = suggestions.controls.map((control) => client.query(controlQuery, [
                        control.id.val,
                        modelId,
                        Suggestion_1.SuggestionStatus.New,
                        control.componentId,
                        control.title,
                        control.description,
                        control.reason,
                        JSON.stringify(control.mitigates),
                        suggestions.sourceSlug,
                    ]));
                }
                const queries = bulkThreats.concat(bulkControls);
                yield Promise.all(queries);
                yield client.query("COMMIT");
                this.log.debug(`inserted ${bulkThreats.length} suggested threats, ${bulkControls.length} suggested controls.`);
                this.emit("updated-for", {
                    modelId,
                });
            }
            catch (e) {
                yield client.query("ROLLBACK");
                this.log.error("Failed to insert suggestions", e);
            }
            finally {
                client.release();
            }
        });
    }
    listControlSuggestions(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT * 
      FROM suggested_controls
      WHERE model_id = $1::uuid
    `;
            const res = yield this.pool.query(query, [modelId]);
            return res.rows.map(convertToSuggestionControl);
        });
    }
    listThreatSuggestions(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Add pagination here later if needed.
            const query = `
      SELECT * 
      FROM suggested_threats
      WHERE model_id = $1::uuid
    `;
            const res = yield this.pool.query(query, [modelId]);
            return res.rows.map(convertToSuggestionThreat);
        });
    }
    /**
     * Delete suggestions by model id and component id
     * @param modelId
     * @param componentIds
     * @returns
     */
    deleteByComponentId(modelId, componentIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!componentIds || componentIds.length === 0) {
                return false;
            }
            const filter = `IN (${componentIds
                .map((_, i) => `$${2 + i}::uuid`)
                .join(",")})`;
            const threatsQuery = `
    DELETE FROM suggested_threats 
    WHERE model_id = $1::uuid AND component_id ${filter}`;
            const controlsQuery = `
    DELETE FROM suggested_controls 
    WHERE model_id = $1::uuid AND component_id ${filter}
    `;
            return ((yield Promise.all([
                this.pool.query(threatsQuery, [modelId, ...componentIds]),
                this.pool.query(controlsQuery, [modelId, ...componentIds]),
            ])).reduce((p, c) => p + c.rowCount, 0) > 0);
        });
    }
    /**
     * Sets SuggestionStatus for a given suggestion
     * @param suggestionId either threat or control suggestionId
     * @param status the new status of the suggestion
     */
    setSuggestionStatus(modelId, suggestionId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            let query;
            if (suggestionId.isThreat) {
                query = `
      UPDATE suggested_threats
      SET status = $1::varchar
      WHERE id = $2::varchar and model_id = $3::uuid
    `;
            }
            else {
                query = `
      UPDATE suggested_controls 
      SET status = $1::varchar
      WHERE id = $2::varchar AND model_id = $3::uuid
    `;
            }
            const res = yield this.pool.query(query, [
                status,
                suggestionId.val,
                modelId,
            ]);
            this.emit("updated-for", {
                modelId,
            });
            return res.rowCount > 0;
        });
    }
    getById(modelId, suggestionId) {
        return __awaiter(this, void 0, void 0, function* () {
            let query;
            if (suggestionId.isThreat) {
                query = `
      SELECT * 
      FROM suggested_threats
      WHERE model_id = $1::uuid and id = $2::varchar`;
            }
            else {
                query = `
      SELECT * 
      FROM suggested_controls
      WHERE model_id = $1::uuid and id = $2::varchar`;
            }
            const res = yield this.pool.query(query, [modelId, suggestionId.val]);
            if (res.rowCount === 0) {
                return null;
            }
            if (suggestionId.isThreat) {
                return convertToSuggestionThreat(res.rows[0]);
            }
            else {
                return convertToSuggestionControl(res.rows[0]);
            }
        });
    }
    acceptSuggestion(modelId, suggestionId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const suggestion = yield this.getById(modelId, suggestionId);
            if (suggestion === null) {
                this.log.debug(`suggestion ${suggestionId.val} not found`);
                return false;
            }
            if (!(yield this.setSuggestionStatus(modelId, suggestionId, Suggestion_1.SuggestionStatus.Accepted))) {
                this.log.debug(`was not able to set suggestion ${suggestionId.val} to accepted`);
                return false;
            }
            if ((0, Suggestion_1.isControl)(suggestion)) {
                // isControl
                const control = new Control_1.default(suggestion.title, suggestion.description, false, suggestion.modelId, suggestion.componentId, user, suggestion.id);
                const controlId = yield this.dal.controlService.create(control);
                // Insert as mitigation to any threats that match the partialId.
                const threatIds = yield this.getThreatsByPartialSuggestion(modelId, suggestion.mitigates.map((m) => m.partialThreatId));
                yield Promise.all(threatIds.map((t) => __awaiter(this, void 0, void 0, function* () { return this.dal.mitigationService.create(new Mitigation_1.default(t, controlId, user)); })));
            }
            else {
                const threat = new Threat_1.default(suggestion.title, suggestion.description, modelId, suggestion.componentId, user, suggestion.id);
                yield this.dal.threatService.create(threat);
            }
            return true;
        });
    }
    getThreatsByPartialSuggestion(modelId, partialSuggestionIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (partialSuggestionIds.length === 0) {
                return [];
            }
            const query = `SELECT id FROM threats 
      WHERE model_id = $1::uuid AND (${partialSuggestionIds
                .map((_, i) => `suggestion_id LIKE $${i + 2}::varchar`)
                .join(" OR ")}) AND deleted_at IS NULL`;
            const sanitized = partialSuggestionIds.map((psi) => `%${psi.replace("%", "").replace("'", "")}`);
            const res = yield this.pool.query(query, [modelId, ...sanitized]);
            return res.rows.map((r) => r.id);
        });
    }
    _getLinkedThreatOrControl(modelId, suggestionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (suggestionId.isThreat) {
                const query = "SELECT * FROM threats WHERE model_id = $1::uuid and suggestion_id = $2::varchar";
                const res = yield this.pool.query(query, [modelId, suggestionId.val]);
                return (0, ThreatDataService_1.convertToThreat)(res.rows[0]);
            }
            else {
                const query = "SELECT * FROM controls WHERE model_id = $1::uuid and suggestion_id = $2::varchar";
                const res = yield this.pool.query(query, [modelId, suggestionId.val]);
                return (0, ControlDataService_1.convertToControl)(res.rows[0]);
            }
        });
    }
}
exports.SuggestionDataService = SuggestionDataService;
//# sourceMappingURL=SuggestionDataService.js.map
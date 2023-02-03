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
exports.MitigationDataService = void 0;
const stream_1 = require("stream");
const logger_1 = require("../../logger");
const Mitigation_1 = __importDefault(require("./Mitigation"));
function convertToMitigation(row) {
    const mitigation = new Mitigation_1.default(row.threat_id, row.control_id, row.created_by);
    mitigation.createdAt = row.created_at * 1000;
    mitigation.updatedAt = row.updated_at * 1000;
    return mitigation;
}
class MitigationDataService extends stream_1.EventEmitter {
    constructor(pool) {
        super();
        this.pool = pool;
        this.log = (0, logger_1.getLogger)("MitigationDataService");
    }
    /**
     * Create a mitigation object
     * @param {Control} control - Control creation object
     * @returns {string}
     */
    create(mitigation) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const client = yield this.pool.connect();
            try {
                yield client.query("BEGIN");
                yield client.query(query, [threatId, controlId, createdBy]);
                const res_threats = yield client.query(queryThreats, [threatId]);
                yield client.query("COMMIT");
                this.emit("updated-for", {
                    modelId: res_threats.rows[0].model_id,
                    componentId: res_threats.rows[0].component_id,
                });
                return { threatId, controlId };
            }
            catch (e) {
                yield client.query("ROLLBACK");
                this.log.error("Failed to create mitigation", e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    /**
     * Retrieve a mitigation object
     * @param {string} threatId - Threat identifier
     * @param {string} controlId - Control identifier
     * @returns {Mitigation}
     */
    getById(threatId, controlId) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const res = yield this.pool.query(query, [threatId, controlId]);
            if (res.rows.length === 0) {
                return null;
            }
            return convertToMitigation(res.rows[0]);
        });
    }
    /**
     * Retrieve the mitigations objects
     * @param {string} modelId - Model identifier
     * @returns {Control}
     */
    list(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const res = yield this.pool.query(query, [modelId]);
            if (res.rows.length === 0) {
                return [];
            }
            return res.rows.map((record) => convertToMitigation(record));
        });
    }
    /**
     * Delete mitigation object
     * @param {string} threatId - Threat identifier
     * @param {string} controlId - Control identifier
     */
    delete(threatId, controlId) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const res = yield this.pool.query(query, [threatId, controlId]);
            if (res.rowCount > 0) {
                this.emit("updated-for", {
                    modelId: res.rows[0].model_id,
                    componentId: res.rows[0].component_id,
                });
                return true;
            }
            return false;
        });
    }
}
exports.MitigationDataService = MitigationDataService;
//# sourceMappingURL=MitigationDataService.js.map
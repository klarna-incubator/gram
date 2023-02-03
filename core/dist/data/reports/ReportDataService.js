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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportDataService = void 0;
const logger_1 = require("../../logger");
const links_1 = require("../../util/links");
class ReportDataService {
    constructor(pool, dal) {
        this.pool = pool;
        this.dal = dal;
        this.log = (0, logger_1.getLogger)("ReportDataService");
    }
    listSystemCompliance(ctx, pagesize, page) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `        
        SELECT DISTINCT ON (m.system_id)
            m.system_id, 
            approved_models.model_id as approved_model_id, 
            approved_models.approved_at, 
            pending_models.model_id as pending_model_id,
            pending_models.status,
            pending_models.created_at,
            pending_models.updated_at
        FROM models m
        LEFT JOIN (
            SELECT DISTINCT ON (m1.system_id) m1.id as model_id, m1.system_id, r1.approved_at as approved_at
            FROM models m1
            INNER JOIN reviews r1 ON r1.model_id = m1.id
            WHERE r1.status = 'approved' AND r1.deleted_at IS NULL AND m1.deleted_at IS NULL
            ORDER BY m1.system_id, r1.approved_at DESC
        ) approved_models on approved_models.system_id = m.system_id
        LEFT JOIN (
            SELECT DISTINCT ON (m2.system_id) m2.id as model_id, m2.system_id, r2.status, r2.created_at, r2.updated_at
            FROM models m2
            INNER JOIN reviews r2 ON r2.model_id = m2.id
            WHERE r2.status IN ('requested', 'meeting-requested') AND r2.deleted_at IS NULL AND m2.deleted_at IS NULL
            ORDER BY m2.system_id, r2.created_at DESC
        ) pending_models on pending_models.system_id = m.system_id
        WHERE m.system_id IS NOT NULL and m.system_id != '00000000-0000-0000-0000-000000000000'
        ORDER BY m.system_id DESC
        ${pagesize && pagesize > 0
                ? `LIMIT ${pagesize} ${page && page > 0 ? `OFFSET ${(page - 1) * pagesize}` : ""}`
                : ""};
      `;
            const res = yield this.pool.query(query);
            const count = (yield this.pool.query("SELECT count(DISTINCT system_id) FROM models")).rows[0].count;
            return {
                Systems: yield Promise.all(res.rows.map((row) => __awaiter(this, void 0, void 0, function* () {
                    const hasPending = row.created_at > row.approved_at;
                    return {
                        SystemID: row.system_id,
                        ApprovedModelId: row.approved_model_id,
                        ApprovedModelURL: row.approved_model_id
                            ? (0, links_1.linkToModel)(row.approved_model_id)
                            : null,
                        ApprovedAt: row.approved_at,
                        PendingModelId: hasPending ? row.pending_model_id : null,
                        PendingModelURL: hasPending && row.pending_model_id
                            ? (0, links_1.linkToModel)(row.pending_model_id)
                            : null,
                        PendingModelUpdatedAt: hasPending ? row.updated_at : null,
                        PendingStatus: hasPending ? row.status : null,
                        PendingModelCreatedAt: hasPending ? row.created_at : null,
                        Properties: yield this.dal.sysPropHandler.contextualize(ctx, row.system_id, true),
                    };
                }))),
                Page: page || 1,
                Pagesize: pagesize || count,
                Pages: Math.floor(count / (pagesize || count)) +
                    (count % (pagesize || count) > 0 ? 1 : 0),
                TotalSystems: count,
            };
        });
    }
}
exports.ReportDataService = ReportDataService;
//# sourceMappingURL=ReportDataService.js.map
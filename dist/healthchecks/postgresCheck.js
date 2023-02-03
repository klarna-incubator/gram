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
exports.postgresAvailableConnectionsCheck = exports.postgresSimpleQueryCheck = void 0;
const express_physical_1 = __importDefault(require("express-physical"));
const logger_1 = require("@gram/core/dist/logger");
const log = (0, logger_1.getLogger)("postgresCheck");
function postgresSimpleQueryCheck(dal) {
    return __awaiter(this, void 0, void 0, function* () {
        return (done) => __awaiter(this, void 0, void 0, function* () {
            const check = {
                name: "@gram/api-postgres",
                actionable: true,
                healthy: true,
                dependentOn: "postgres",
                type: express_physical_1.default.type.EXTERNAL_DEPENDENCY,
            };
            try {
                yield dal.pool.query("SELECT 1;");
            }
            catch (error) {
                log.error(error);
                check.healthy = false;
                check.message =
                    "Postgres went down. Please check error log for more info";
                check.severity = express_physical_1.default.severity.CRITICAL;
            }
            done(express_physical_1.default.response(check));
        });
    });
}
exports.postgresSimpleQueryCheck = postgresSimpleQueryCheck;
function postgresAvailableConnectionsCheck(dal) {
    return __awaiter(this, void 0, void 0, function* () {
        return (done) => __awaiter(this, void 0, void 0, function* () {
            const check = {
                name: "@gram/api-postgres-available-connections",
                actionable: true,
                healthy: dal.pool.waitingCount === 0,
                dependentOn: "postgres",
                type: express_physical_1.default.type.EXTERNAL_DEPENDENCY,
                severity: express_physical_1.default.severity.WARNING,
                message: "The internal Postgres connection pool has been exhausted and clients are waiting. This means that queries are left hanging",
            };
            done(express_physical_1.default.response(check));
        });
    });
}
exports.postgresAvailableConnectionsCheck = postgresAvailableConnectionsCheck;
//# sourceMappingURL=postgresCheck.js.map
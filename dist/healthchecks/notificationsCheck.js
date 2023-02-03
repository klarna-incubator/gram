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
exports.notificationsStalledCheck = exports.notificationsFailedCheck = void 0;
const express_physical_1 = __importDefault(require("express-physical"));
const logger_1 = require("@gram/core/dist/logger");
const log = (0, logger_1.getLogger)("notificationsCheck");
function notificationsFailedCheck(dal) {
    return (done) => __awaiter(this, void 0, void 0, function* () {
        const check = {
            name: "@gram/api-notifications-failed",
            actionable: true,
            healthy: true,
            dependentOn: "postgres",
            type: express_physical_1.default.type.EXTERNAL_DEPENDENCY,
        };
        try {
            const failed = yield dal.notificationService.countFailures();
            if (failed > 0) {
                check.healthy = false;
                check.message = `There are ${failed} notifications that failed on the notifications queue.`;
                check.severity = express_physical_1.default.severity.WARNING;
            }
        }
        catch (error) {
            log.error(error);
            check.healthy = false;
            check.message =
                "Failed to check for failed notifications. Please check error log for more info";
            check.severity = express_physical_1.default.severity.WARNING;
        }
        done(express_physical_1.default.response(check));
    });
}
exports.notificationsFailedCheck = notificationsFailedCheck;
function notificationsStalledCheck(dal) {
    return (done) => __awaiter(this, void 0, void 0, function* () {
        const check = {
            name: "@gram/api-notifications-stalled",
            actionable: true,
            healthy: true,
            dependentOn: "postgres",
            type: express_physical_1.default.type.INFRASTRUCTURE,
        };
        try {
            const stalled = yield dal.notificationService.countStalled();
            if (stalled > 0) {
                check.healthy = false;
                check.message = `There are ${stalled} notifications that have stalled on the notifications queue.`;
                check.severity = express_physical_1.default.severity.WARNING;
            }
        }
        catch (error) {
            log.error(error);
            check.healthy = false;
            check.message =
                "Failed to check for stalled notifications. Please check error log for more info";
            check.severity = express_physical_1.default.severity.WARNING;
        }
        done(express_physical_1.default.response(check));
    });
}
exports.notificationsStalledCheck = notificationsStalledCheck;
//# sourceMappingURL=notificationsCheck.js.map
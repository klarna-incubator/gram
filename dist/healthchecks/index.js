"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthChecks = void 0;
const express_physical_1 = __importDefault(require("express-physical"));
const notificationsCheck_1 = require("./notificationsCheck");
const postgresCheck_1 = require("./postgresCheck");
const selfCheck_1 = require("./selfCheck");
const createHealthChecks = (dal) => 
//TODO ability to extend with deployment specific healtchecks
(0, express_physical_1.default)([
    selfCheck_1.selfCheck,
    (0, postgresCheck_1.postgresSimpleQueryCheck)(dal),
    (0, postgresCheck_1.postgresAvailableConnectionsCheck)(dal),
    (0, notificationsCheck_1.notificationsFailedCheck)(dal),
    (0, notificationsCheck_1.notificationsStalledCheck)(dal),
]);
exports.createHealthChecks = createHealthChecks;
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = void 0;
const express_prom_bundle_1 = __importDefault(require("express-prom-bundle"));
exports.metricsMiddleware = (0, express_prom_bundle_1.default)({
    includeMethod: true,
    metricType: "summary",
    autoregister: false,
});
//# sourceMappingURL=metrics.js.map
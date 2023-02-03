"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createControlApp = void 0;
const Sentry = __importStar(require("@sentry/node"));
const express_1 = __importDefault(require("express"));
const healthchecks_1 = require("./healthchecks");
const metrics_1 = require("./metrics/metrics");
const errorHandler_1 = __importDefault(require("./util/errorHandler"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const version = require("../package.json").version;
function createControlApp(dal) {
    const app = (0, express_1.default)();
    app.use(metrics_1.metricsMiddleware.metricsMiddleware);
    app.use(express_1.default.json());
    app.get("/healthcheck", (0, healthchecks_1.createHealthChecks)(dal));
    app.get("/service-metadata", (_req, res) => {
        return res.json({
            service_name: "gram",
            service_version: version,
            description: "Threat modeling",
            owner: "Secure Development",
            tags: ["threat-modeling", "appsec", "security"],
        });
    });
    app.get("/ping", (_req, res) => res.json({ message: "pong" }));
    // Sentry Error Handler
    app.use(Sentry.Handlers.errorHandler());
    // Global Error Handler. Should catch anything that propagates up from the REST routes.
    app.use(errorHandler_1.default);
    return app;
}
exports.createControlApp = createControlApp;
//# sourceMappingURL=controlApp.js.map
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
const Sentry = __importStar(require("@sentry/node"));
const config_1 = __importDefault(require("config"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const express_async_error_wrapper_1 = __importDefault(require("express-async-error-wrapper"));
const path_1 = __importDefault(require("path"));
const Role_1 = require("@gram/core/dist/auth/models/Role");
const dal_1 = require("@gram/core/dist/data/dal");
const logger_1 = require("@gram/core/dist/logger");
const metrics_1 = require("./metrics/metrics");
const auth_1 = require("./middlewares/auth");
const authz_1 = require("./middlewares/authz");
const cache_1 = __importDefault(require("./middlewares/cache"));
const logger_2 = __importDefault(require("./middlewares/logger"));
const securityHeaders_1 = require("./middlewares/securityHeaders");
const plugin_1 = require("@gram/core/dist/plugin");
const crash_1 = __importDefault(require("./resources/gram/v1/admin/crash"));
const dropRole_1 = __importDefault(require("./resources/gram/v1/admin/dropRole"));
const get_1 = require("./resources/gram/v1/banners/get");
const search_1 = require("./resources/gram/v1/component-classes/search");
const controls_1 = __importDefault(require("./resources/gram/v1/controls"));
const get_2 = require("./resources/gram/v1/menu/get");
const mitigations_1 = require("./resources/gram/v1/mitigations");
const models_1 = __importDefault(require("./resources/gram/v1/models"));
const system_compliance_1 = require("./resources/gram/v1/reports/system-compliance");
const reviews_1 = __importDefault(require("./resources/gram/v1/reviews"));
const suggestions_1 = __importDefault(require("./resources/gram/v1/suggestions"));
const system_properties_1 = __importDefault(require("./resources/gram/v1/system-properties"));
const systems_1 = __importDefault(require("./resources/gram/v1/systems"));
const threats_1 = __importDefault(require("./resources/gram/v1/threats"));
const token_1 = __importDefault(require("./resources/gram/v1/token"));
const user_1 = __importDefault(require("./resources/gram/v1/user"));
const errorHandler_1 = __importDefault(require("./util/errorHandler"));
const sentry_1 = require("./util/sentry");
function createApp(pool) {
    return __awaiter(this, void 0, void 0, function* () {
        // Set up business logic handlers and services
        const dal = new dal_1.DataAccessLayer(pool);
        // Start constructing the app.
        const app = (0, express_1.default)();
        // Sentry has to be set up before everything else.
        (0, sentry_1.initSentry)(app);
        // Metrics middleware
        app.use(metrics_1.metricsMiddleware);
        // JSON middleware to automatically parse incoming requests
        app.use(express_1.default.json());
        app.use((0, securityHeaders_1.securityHeaders)());
        app.use((0, cookie_parser_1.default)());
        const auditHttpLogOptions = config_1.default.get("log.auditHttp");
        const loggerMwOpts = Object.assign({ logger: (0, logger_1.getLogger)("auditHttp") }, auditHttpLogOptions);
        const authz = (0, authz_1.AuthzMiddleware)({ dal });
        const cache = (0, cache_1.default)();
        const systemPropertyRoutes = (0, system_properties_1.default)(dal);
        // Register Global Middleware
        app.use(auth_1.validateTokenMiddleware);
        app.use((0, logger_2.default)(loggerMwOpts));
        app.use(express_1.default.static("frontend/"));
        app.use(authz);
        // Register Routes
        const unauthenticatedRoutes = express_1.default.Router();
        unauthenticatedRoutes.get("/banners", (0, express_async_error_wrapper_1.default)((0, get_1.getBanner)(dal)));
        unauthenticatedRoutes.get("/menu", (0, express_async_error_wrapper_1.default)(get_2.getMenu));
        unauthenticatedRoutes.get("/auth/token", (0, express_async_error_wrapper_1.default)(token_1.default.get));
        unauthenticatedRoutes.get("/auth/csrf", (0, express_async_error_wrapper_1.default)(token_1.default.csrf));
        unauthenticatedRoutes.get("/auth/params", (0, express_async_error_wrapper_1.default)(token_1.default.params));
        unauthenticatedRoutes.delete("/auth/token", (0, express_async_error_wrapper_1.default)(token_1.default.delete));
        // Authenticated routes
        const authenticatedRoutes = express_1.default.Router();
        authenticatedRoutes.use(auth_1.authRequiredMiddleware);
        authenticatedRoutes.get("/user", (0, express_async_error_wrapper_1.default)(user_1.default.get));
        const systems = (0, systems_1.default)(dal);
        authenticatedRoutes.get("/systems", (0, express_async_error_wrapper_1.default)(systems.list));
        authenticatedRoutes.get("/systems/:id", (0, express_async_error_wrapper_1.default)(systems.get));
        authenticatedRoutes.get("/systems/:id/permissions", (0, express_async_error_wrapper_1.default)(systems.permission));
        // Models
        const models = (0, models_1.default)(dal.modelService);
        authenticatedRoutes.get("/models", (0, express_async_error_wrapper_1.default)(models.list));
        authenticatedRoutes.post("/models", (0, express_async_error_wrapper_1.default)(models.create));
        authenticatedRoutes.get("/models/templates", (0, express_async_error_wrapper_1.default)(models.templates)); // Model templates
        authenticatedRoutes.patch("/models/:id", (0, express_async_error_wrapper_1.default)(models.patch));
        authenticatedRoutes.delete("/models/:id", (0, express_async_error_wrapper_1.default)(models.delete));
        authenticatedRoutes.get("/models/:id", (0, express_async_error_wrapper_1.default)(models.get));
        authenticatedRoutes.patch("/models/:id/set-template", (0, express_async_error_wrapper_1.default)(models.setTemplate));
        authenticatedRoutes.get("/models/:id/permissions", (0, express_async_error_wrapper_1.default)(models.permissions));
        // Threats
        const threats = (0, threats_1.default)(dal);
        authenticatedRoutes.get("/models/:modelId/threats", (0, express_async_error_wrapper_1.default)(threats.list));
        authenticatedRoutes.post("/models/:modelId/threats", (0, express_async_error_wrapper_1.default)(threats.create));
        authenticatedRoutes.patch("/models/:modelId/threats/:threatId", (0, express_async_error_wrapper_1.default)(threats.update));
        authenticatedRoutes.delete("/models/:modelId/threats/:threatId", (0, express_async_error_wrapper_1.default)(threats.delete));
        // Controls
        const controls = (0, controls_1.default)(dal);
        authenticatedRoutes.get("/models/:modelId/controls", (0, express_async_error_wrapper_1.default)(controls.list));
        authenticatedRoutes.post("/models/:modelId/controls", (0, express_async_error_wrapper_1.default)(controls.create));
        authenticatedRoutes.patch("/models/:modelId/controls/:id", (0, express_async_error_wrapper_1.default)(controls.update));
        authenticatedRoutes.delete("/models/:modelId/controls/:id", (0, express_async_error_wrapper_1.default)(controls.delete));
        // Mitigations
        const mitigations = (0, mitigations_1.mitigationsV1)(dal);
        authenticatedRoutes.get("/models/:modelId/mitigations", (0, express_async_error_wrapper_1.default)(mitigations.list));
        authenticatedRoutes.post("/models/:modelId/mitigations", (0, express_async_error_wrapper_1.default)(mitigations.create));
        authenticatedRoutes.delete("/models/:modelId/mitigations", (0, express_async_error_wrapper_1.default)(mitigations.delete));
        // Reviews
        const reviews = (0, reviews_1.default)(dal);
        authenticatedRoutes.get("/reviews", (0, express_async_error_wrapper_1.default)(reviews.list));
        authenticatedRoutes.get("/reviews/reviewers", (0, express_async_error_wrapper_1.default)(reviews.reviewers));
        authenticatedRoutes.get("/reviews/:modelId", (0, express_async_error_wrapper_1.default)(reviews.get));
        authenticatedRoutes.post("/reviews/:modelId", (0, express_async_error_wrapper_1.default)(reviews.create));
        authenticatedRoutes.patch("/reviews/:modelId", (0, express_async_error_wrapper_1.default)(reviews.patch));
        authenticatedRoutes.post("/reviews/:modelId/cancel", (0, express_async_error_wrapper_1.default)(reviews.cancel));
        authenticatedRoutes.post("/reviews/:modelId/decline", (0, express_async_error_wrapper_1.default)(reviews.decline));
        authenticatedRoutes.post("/reviews/:modelId/approve", (0, express_async_error_wrapper_1.default)(reviews.approve));
        authenticatedRoutes.post("/reviews/:modelId/request-meeting", (0, express_async_error_wrapper_1.default)(reviews.requestMeeting));
        authenticatedRoutes.post("/reviews/:modelId/change-reviewer", (0, express_async_error_wrapper_1.default)(reviews.changeReviewer));
        // Suggestions
        const suggestions = (0, suggestions_1.default)(dal);
        authenticatedRoutes.patch("/suggestions/:modelId/accept", (0, express_async_error_wrapper_1.default)(suggestions.accept));
        authenticatedRoutes.patch("/suggestions/:modelId/reject", (0, express_async_error_wrapper_1.default)(suggestions.reject));
        authenticatedRoutes.patch("/suggestions/:modelId/reset", (0, express_async_error_wrapper_1.default)(suggestions.reset));
        authenticatedRoutes.get("/suggestions/:modelId", (0, express_async_error_wrapper_1.default)(suggestions.list));
        // System Properties
        authenticatedRoutes.get("/system-properties/:id", cache, (0, express_async_error_wrapper_1.default)(systemPropertyRoutes.get));
        authenticatedRoutes.get("/system-properties", cache, (0, express_async_error_wrapper_1.default)(systemPropertyRoutes.properties));
        // Component Classes
        authenticatedRoutes.get("/component-class", cache, (0, express_async_error_wrapper_1.default)((0, search_1.searchClasses)(dal.ccHandler)));
        // Report Routes
        authenticatedRoutes.get("/reports/system-compliance", cache, (0, express_async_error_wrapper_1.default)((0, system_compliance_1.listSystemCompliance)(dal)));
        // Admin Routes
        authenticatedRoutes.get("/admin/drop_role", authz.is(Role_1.Role.Admin), (0, express_async_error_wrapper_1.default)(dropRole_1.default));
        authenticatedRoutes.get("/admin/crash", authz.is(Role_1.Role.Admin), (0, express_async_error_wrapper_1.default)(crash_1.default));
        app.use("/api/v1", unauthenticatedRoutes);
        app.use("/api/v1", authenticatedRoutes);
        // Serve Assets
        app.use("/assets", express_1.default.static(plugin_1.AssetDir, { index: false, maxAge: 60 * 60 * 1000 }));
        // Static routes and Frontend
        if (process.env.SERVE_FRONTEND) {
            app.get("*", (_, res) => res.sendFile(path_1.default.resolve("frontend", "index.html")));
        }
        // Sentry Error Handler
        app.use(Sentry.Handlers.errorHandler());
        // Global Error Handler. Should catch anything that propagates up from the REST routes.
        app.use(errorHandler_1.default);
        // Return dal here for help injecting mocks into testing later. Not the best solution but should work.
        return {
            app,
            dal,
        };
    });
}
exports.default = createApp;
//# sourceMappingURL=app.js.map
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
exports.initSentry = exports.hasSentry = void 0;
const integrations_1 = require("@sentry/integrations");
const Sentry = __importStar(require("@sentry/node"));
const Tracing = __importStar(require("@sentry/tracing"));
const config_1 = __importDefault(require("config"));
const logger_1 = require("@gram/core/dist/logger");
const log = (0, logger_1.getLogger)("sentry");
// TODO: move to configuration
const ALLOWED_HEADERS = [
    "host",
    "connection",
    "content-type",
    "cache-control",
    "accept",
    "accept-encoding",
    "accept-language",
    "user-agent",
    "upgrade-insecure-requests",
];
function hasSentry() {
    return config_1.default.has("sentryDSN");
}
exports.hasSentry = hasSentry;
function initSentry(app) {
    const sentryDSN = config_1.default.has("sentryDSN") ? config_1.default.get("sentryDSN") : false;
    if (!sentryDSN) {
        return;
    }
    Sentry.init({
        release: `gram@${process.env.npm_package_version}`,
        environment: config_1.default.util.getEnv("NODE_ENV"),
        dsn: sentryDSN,
        integrations: [
            // Sentry.Integrations.Http is not here due to error when used with c2c proxy :/
            //
            // enable Express.js middleware tracing
            new Tracing.Integrations.Express({ app }),
            new integrations_1.RewriteFrames({
                root: global.__rootdir__,
            }),
        ],
        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        tracesSampleRate: 1.0,
        attachStacktrace: true,
        // Scrub the data here to avoid leaking authentication tokens and other
        // potentially sensitive data.
        beforeSend: (event) => {
            var _a, _b, _c, _d;
            // // Modify the event here
            if ((_a = event.request) === null || _a === void 0 ? void 0 : _a.cookies) {
                // Don't send cookies as they contain the auth token
                delete event.request.cookies;
            }
            // Replace headers object
            if ((_b = event.request) === null || _b === void 0 ? void 0 : _b.headers) {
                const newHeaders = {};
                for (const header of ALLOWED_HEADERS) {
                    if ((_c = event.request) === null || _c === void 0 ? void 0 : _c.headers[header]) {
                        newHeaders[header] = (_d = event.request) === null || _d === void 0 ? void 0 : _d.headers[header];
                    }
                }
                event.request.headers = newHeaders;
            }
            // console.log(JSON.stringify(event, null, 4));
            return event;
        },
    });
    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
    log.info("Sentry initialized");
}
exports.initSentry = initSentry;
//# sourceMappingURL=sentry.js.map
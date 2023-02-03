"use strict";
/**
 * Logger implementation from log4js
 * @module logger/log4js
 * @exports logger
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = void 0;
const config_1 = __importDefault(require("config"));
const log4js_1 = __importDefault(require("log4js"));
// TODO pass via configuration/plugin
const sentryLog4jsAppender_1 = require("./sentryLog4jsAppender");
log4js_1.default.addLayout("json", (_config) => (logEvent) => {
    const logLine = {
        type: "log",
        timestamp: logEvent.startTime.toISOString(),
        level: logEvent.level.levelStr,
        message: "",
        correlation_id: "",
        meta: {},
        payload: {},
    };
    const events = logEvent.data.map((event) => {
        const line = Object.assign({}, logLine);
        if (typeof event === "string") {
            line.message = event;
            return line;
        }
        if (event) {
            if (event.payload) {
                line.payload = event.payload;
            }
            if (event.meta) {
                line.meta = event.meta;
            }
            if (event.correlation_id) {
                line.correlation_id = event.correlation_id;
            }
            // Serialize errors, otherwise JSON.stringify on Error returns {}
            if (event.message && event.stack) {
                line.message = event.message;
                line.payload.stack = event.stack;
            }
        }
        return line;
    });
    // logEvent.level = levels.getLevel(logEvent.level.levelStr, levels.WARN);
    // logEvent.context;
    return events.map((event) => JSON.stringify(event)).join("");
});
log4js_1.default.configure({
    appenders: {
        console: {
            type: "console",
            layout: { type: config_1.default.get("log.layout") },
        },
        sentry: {
            type: sentryLog4jsAppender_1.sentryLog4jsAppender,
        },
    },
    categories: {
        default: {
            appenders: ["console", "sentry"],
            level: config_1.default.get("log.level"),
        },
    },
});
exports.getLogger = log4js_1.default.getLogger;
//# sourceMappingURL=index.js.map
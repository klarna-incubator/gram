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
exports.sentryLog4jsAppender = void 0;
const Sentry = __importStar(require("@sentry/node"));
const config_1 = __importDefault(require("config"));
const log4js_1 = require("log4js");
function log4jLevelToSentrySeverity(level) {
    switch (level) {
        case log4js_1.levels.WARN:
            return "warning";
        case log4js_1.levels.DEBUG:
            return "debug";
        case log4js_1.levels.ERROR:
            return "error";
        case log4js_1.levels.FATAL:
            return "fatal";
        case log4js_1.levels.INFO:
            return "info";
        default:
            return "log";
    }
}
function sentryAppender() {
    if (!config_1.default.has("sentryDSN")) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => { };
    }
    return (loggingEvent) => {
        // Send only ERROR/FATAL/WARN events to sentry
        if ([log4js_1.levels.ERROR, log4js_1.levels.FATAL, log4js_1.levels.WARN].includes(loggingEvent.level)) {
            // Avoid double logging of errors.
            if (loggingEvent.data.some((d) => d.errorHandled)) {
                return;
            }
            const msgs = loggingEvent.data.map((d) => d.toString());
            if (msgs.length > 0) {
                Sentry.captureMessage(msgs.join("\n"), {
                    level: log4jLevelToSentrySeverity(loggingEvent.level),
                });
            }
        }
    };
}
exports.sentryLog4jsAppender = {
    configure: function () {
        return sentryAppender();
    },
};
//# sourceMappingURL=sentryLog4jsAppender.js.map
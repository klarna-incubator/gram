/**
 * Logger implementation from log4js
 * @module logger/log4js
 * @exports logger
 */

import log4js from "log4js";
import { sentryLog4jsAppender } from "./sentryLog4jsAppender.js";
import { config } from "../config/index.js";

export type LogLine = {
  type?: "log" | "reqres" | "data" | "metric";
  timestamp: string;
  level: string;
  message: string;
  correlation_id?: string;
  meta: any;
  payload: any;
};

export function configureLogging() {
  log4js.addLayout("json", (_config) => (logEvent) => {
    const logLine: LogLine = {
      type: "log",
      timestamp: logEvent.startTime.toISOString(),
      level: logEvent.level.levelStr,
      message: "",
      correlation_id: "",
      meta: {},
      payload: {},
    };

    for (const event of logEvent.data) {
      if (typeof event === "string") {
        logLine.message = event;
        continue;
      }

      if (event) {
        if (event.payload) {
          logLine.payload = event.payload;
        }

        if (event.meta) {
          logLine.meta = event.meta;
        }

        if (event.correlation_id) {
          logLine.correlation_id = event.correlation_id;
        }

        // Serialize errors, otherwise JSON.stringify on Error returns {}
        if (event.message && event.stack) {
          logLine.message = event.message;
          logLine.payload.stack = event.stack;
        }
      }
    }

    return JSON.stringify(logLine);
  });

  const log4jconfig: log4js.Configuration = {
    appenders: {
      console: {
        type: "console",
        layout: { type: config.log.layout },
      },
      sentry: {
        type: sentryLog4jsAppender, // This defaults to an empty appender if sentryDSN is not provided.
      },
    },
    categories: {
      default: {
        appenders: ["console", "sentry"],
        level: config.log.level,
      },
    },
  };

  log4js.configure(log4jconfig);
}

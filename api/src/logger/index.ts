/**
 * Logger implementation from log4js
 * @module logger/log4js
 * @exports logger
 */

import config from "config";
import log4js from "log4js";
import { sentryLog4jsAppender } from "../util/sentryLog4jsAppender";

export type LogLine = {
  type?: "log" | "reqres" | "data" | "metric";
  timestamp: string;
  level: string;
  message: string;
  correlation_id?: string;
  meta: any;
  payload: any;
};

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

  const events = logEvent.data.map((event) => {
    const line = { ...logLine };
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

log4js.configure({
  appenders: {
    console: {
      type: "console",
      layout: { type: config.get("log.layout") },
    },
    sentry: {
      type: sentryLog4jsAppender,
    },
  },
  categories: {
    default: {
      appenders: ["console", "sentry"],
      level: config.get("log.level") as string,
    },
  },
});

export const getLogger = log4js.getLogger;

import * as Sentry from "@sentry/node";
import { SeverityLevel } from "@sentry/node";
import { config } from "../config/index.js";
import log4js from "log4js";

function log4jLevelToSentrySeverity(level: log4js.Level): SeverityLevel {
  switch (level) {
    case log4js.levels.WARN:
      return "warning";
    case log4js.levels.DEBUG:
      return "debug";
    case log4js.levels.ERROR:
      return "error";
    case log4js.levels.FATAL:
      return "fatal";
    case log4js.levels.INFO:
      return "info";
    default:
      return "log";
  }
}
function sentryAppender(): log4js.AppenderFunction {
  if (!config.sentryDSN) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }

  return (loggingEvent) => {
    // Send only ERROR/FATAL/WARN events to sentry
    if (
      [log4js.levels.ERROR, log4js.levels.FATAL, log4js.levels.WARN].includes(
        loggingEvent.level
      )
    ) {
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

export const sentryLog4jsAppender: log4js.AppenderModule = {
  configure: function (): log4js.AppenderFunction {
    return sentryAppender();
  },
};

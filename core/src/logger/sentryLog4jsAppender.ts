import * as Sentry from "@sentry/node";
import { SeverityLevel } from "@sentry/node";
import { config } from "../config";
import { AppenderFunction, AppenderModule, Level, levels } from "log4js";

function log4jLevelToSentrySeverity(level: Level): SeverityLevel {
  switch (level) {
    case levels.WARN:
      return "warning";
    case levels.DEBUG:
      return "debug";
    case levels.ERROR:
      return "error";
    case levels.FATAL:
      return "fatal";
    case levels.INFO:
      return "info";
    default:
      return "log";
  }
}
function sentryAppender(): AppenderFunction {
  if (!config.sentryDSN) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }

  return (loggingEvent) => {
    // Send only ERROR/FATAL/WARN events to sentry
    if (
      [levels.ERROR, levels.FATAL, levels.WARN].includes(loggingEvent.level)
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

export const sentryLog4jsAppender: AppenderModule = {
  configure: function (): AppenderFunction {
    return sentryAppender();
  },
};

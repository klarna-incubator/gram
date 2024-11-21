import { config } from "@gram/core/dist/config/index.js";
import * as Sentry from "@sentry/node";
import log4js from "log4js";
import { version } from "./version.js";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const log = log4js.getLogger("sentry");

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

export function hasSentry() {
  return !!config.sentryDSN;
}

export function initSentry() {
  const sentryDSN = config.sentryDSN;
  if (!sentryDSN) {
    return;
  }

  Sentry.init({
    release: `gram@${version}`,
    environment: process.env["NODE_ENV"],
    dsn: sentryDSN as string,
    integrations: [nodeProfilingIntegration()],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    tracesSampleRate: 1.0,
    attachStacktrace: true,

    // Scrub the data here to avoid leaking authentication tokens and other
    // potentially sensitive data.
    beforeSend: (event) => {
      // // Modify the event here
      if (event.request?.cookies) {
        // Don't send cookies as they contain the auth token
        delete event.request.cookies;
      }

      // Replace headers object
      if (event.request?.headers) {
        const newHeaders: { [key: string]: string } = {};
        for (const header of ALLOWED_HEADERS) {
          if (event.request?.headers[header]) {
            newHeaders[header] = event.request?.headers[header];
          }
        }
        event.request.headers = newHeaders;
      }

      // console.log(JSON.stringify(event, null, 4));
      return event;
    },
  });

  log.info("Sentry initialized");
}

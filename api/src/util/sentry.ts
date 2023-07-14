import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { Express } from "express";
import { getLogger } from "log4js";
import { config } from "@gram/core/dist/config";

const log = getLogger("sentry");

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

export function initSentry(app: Express) {
  const sentryDSN = config.sentryDSN;
  if (!sentryDSN) {
    return;
  }

  Sentry.init({
    release: `gram@${process.env.npm_package_version}`,
    environment: process.env["NODE_ENV"],
    dsn: sentryDSN as string,
    integrations: [
      // Sentry.Integrations.Http is not here due to error when used with c2c proxy :/
      //
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
      new RewriteFrames({
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

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  log.info("Sentry initialized");
}

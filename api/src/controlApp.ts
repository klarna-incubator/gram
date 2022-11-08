import * as Sentry from "@sentry/node";
import express from "express";
import { DataAccessLayer } from "./data/dal";
import { createHealthChecks } from "./healthchecks";
import { metricsMiddleware } from "./metrics/metrics";
import errorHandler from "./util/errorHandler";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const version = require("../package.json").version;

export function createControlApp(dal: DataAccessLayer) {
  const app = express();
  app.use(metricsMiddleware.metricsMiddleware);
  app.use(express.json());

  app.get("/healthcheck", createHealthChecks(dal));
  app.get("/service-metadata", (_req, res) => {
    return res.json({
      service_name: "gram",
      service_version: version,
      description: "Threat modeling",
      owner: "Secure Development",
      tags: ["threat-modeling", "appsec", "security"],
    });
  });
  app.get("/ping", (_req, res) => res.json({ message: "pong" }));

  // Sentry Error Handler
  app.use(Sentry.Handlers.errorHandler());
  // Global Error Handler. Should catch anything that propagates up from the REST routes.
  app.use(errorHandler);

  return app;
}

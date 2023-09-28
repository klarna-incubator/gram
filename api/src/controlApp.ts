import * as Sentry from "@sentry/node";
import express from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createHealthChecks } from "./healthchecks/index.js";
import { metricsMiddleware } from "./metrics/metrics.js";
import errorHandler from "./middlewares/errorHandler.js";

export function createControlApp(dal: DataAccessLayer) {
  const app = express();
  app.use(metricsMiddleware.metricsMiddleware);
  app.use(express.json());

  app.get("/healthcheck", createHealthChecks(dal));
  app.get("/service-metadata", (_req, res) => {
    return res.json({
      service_name: "gram",
      service_version: `${process.env.npm_package_version}`,
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

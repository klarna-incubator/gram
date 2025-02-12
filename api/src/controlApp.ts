import * as Sentry from "@sentry/node";
import express from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createHealthChecks } from "./healthchecks/index.js";
import { metricsMiddleware } from "./metrics/metrics.js";
import errorHandler from "./middlewares/errorHandler.js";
import { version } from "./util/version.js";

export function createControlApp(dal: DataAccessLayer): Express.Application {
  const app = express();

  app.use(express.json());

  // Metrics Middleware - needs to be used before any routes are defined
  app.use(metricsMiddleware);
  // app.use(metricsMiddleware.metricsApp);

  app.get("/healthcheck", createHealthChecks(dal));
  app.get("/service-metadata", (_req, res) => {
    res.json({
      service_name: "gram",
      service_version: `${version}`,
      description: "Threat modeling",
      owner: "Secure Development",
      tags: ["threat-modeling", "appsec", "security"],
    });
  });
  app.get("/ping", (_req, res) => { res.json({ message: "pong" }) });


  // Sentry Error Handler
  Sentry.setupExpressErrorHandler(app);

  // Global Error Handler. Should catch anything that propagates up from the REST routes.
  app.use(errorHandler);

  return app;
}

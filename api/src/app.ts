import * as Sentry from "@sentry/node";
import express from "express";
import errorWrap from "express-async-error-wrapper";
import path from "path";
import { Role } from "@gram/core/dist/auth/models/Role";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { getLogger } from "log4js";
import { metricsMiddleware } from "./metrics/metrics";
import {
  authRequiredMiddleware,
  validateTokenMiddleware,
} from "./middlewares/auth";
import { AuthzMiddleware } from "./middlewares/authz";
import cacheMw from "./middlewares/cache";
import loggerMw from "./middlewares/logger";
import { securityHeaders } from "./middlewares/securityHeaders";
import { AssetDir } from "@gram/core/dist/Bootstrapper";
import crash from "./resources/gram/v1/admin/crash";
import setRoles from "./resources/gram/v1/admin/setRoles";
import { getBanner } from "./resources/gram/v1/banners/get";
import { searchClasses } from "./resources/gram/v1/component-classes/search";
import controlsV1 from "./resources/gram/v1/controls";
import { getMenu } from "./resources/gram/v1/menu/get";
import { mitigationsV1 } from "./resources/gram/v1/mitigations";
import modelsV1 from "./resources/gram/v1/models";
import { listSystemCompliance } from "./resources/gram/v1/reports/system-compliance";
import reviewsV1 from "./resources/gram/v1/reviews";
import suggestionsV1 from "./resources/gram/v1/suggestions";
import systemPropertyRoutesV1 from "./resources/gram/v1/system-properties";
import systemsV1 from "./resources/gram/v1/systems";
import threatsV1 from "./resources/gram/v1/threats";
import tokenV1 from "./resources/gram/v1/token";
import userV1 from "./resources/gram/v1/user";
import errorHandler from "./middlewares/errorHandler";
import { initSentry } from "./util/sentry";
import { retryReviewApproval } from "./resources/gram/v1/admin/retryReviewApproval";
import { config } from "@gram/core/dist/config";

export async function createApp(dal: DataAccessLayer) {
  // Start constructing the app.
  const app = express();

  // Sentry has to be set up before everything else.
  initSentry(app);

  // Metrics middleware
  app.use(metricsMiddleware);

  // JSON middleware to automatically parse incoming requests
  app.use(express.json());
  app.use(securityHeaders());

  const loggerMwOpts = {
    logger: getLogger("auditHttp"),
    ...config.log.auditHttp,
  };

  const authz = AuthzMiddleware({ dal });
  const cache = cacheMw();

  const systemPropertyRoutes = systemPropertyRoutesV1(dal);

  // Register Global Middleware
  app.use(validateTokenMiddleware);
  app.use(loggerMw(loggerMwOpts));
  app.use(express.static("frontend/"));
  app.use(authz);

  // Register Routes
  const unauthenticatedRoutes = express.Router();
  unauthenticatedRoutes.get("/banners", errorWrap(getBanner(dal)));
  unauthenticatedRoutes.get("/menu", errorWrap(getMenu));

  const tokenRoutes = tokenV1(dal);
  unauthenticatedRoutes.get("/auth/token", errorWrap(tokenRoutes.get));
  unauthenticatedRoutes.post("/auth/token", errorWrap(tokenRoutes.get));
  unauthenticatedRoutes.get("/auth/params", errorWrap(tokenRoutes.params));
  unauthenticatedRoutes.delete("/auth/token", errorWrap(tokenRoutes.delete));

  // Authenticated routes
  const authenticatedRoutes = express.Router();
  authenticatedRoutes.use(authRequiredMiddleware);
  authenticatedRoutes.get("/user", errorWrap(userV1.get));

  const systems = systemsV1(dal);
  authenticatedRoutes.get("/systems", errorWrap(systems.list));
  authenticatedRoutes.get("/systems/:id", errorWrap(systems.get));
  authenticatedRoutes.get(
    "/systems/:id/permissions",
    errorWrap(systems.permission)
  );
  authenticatedRoutes.get(
    "/systems/:id/compliance",
    errorWrap(systems.compliance)
  );

  // Models
  const models = modelsV1(dal.modelService);
  authenticatedRoutes.get("/models", errorWrap(models.list));
  authenticatedRoutes.post("/models", errorWrap(models.create));
  authenticatedRoutes.get("/models/templates", errorWrap(models.templates)); // Model templates
  authenticatedRoutes.patch("/models/:id", errorWrap(models.patch));
  authenticatedRoutes.delete("/models/:id", errorWrap(models.delete));
  authenticatedRoutes.get("/models/:id", errorWrap(models.get));
  authenticatedRoutes.patch(
    "/models/:id/set-template",
    errorWrap(models.setTemplate)
  );
  authenticatedRoutes.get(
    "/models/:id/permissions",
    errorWrap(models.permissions)
  );

  // Threats
  const threats = threatsV1(dal);
  authenticatedRoutes.get("/models/:modelId/threats", errorWrap(threats.list));
  authenticatedRoutes.post(
    "/models/:modelId/threats",
    errorWrap(threats.create)
  );
  authenticatedRoutes.patch(
    "/models/:modelId/threats/:threatId",
    errorWrap(threats.update)
  );
  authenticatedRoutes.delete(
    "/models/:modelId/threats/:threatId",
    errorWrap(threats.delete)
  );

  // Controls
  const controls = controlsV1(dal);
  authenticatedRoutes.get(
    "/models/:modelId/controls",
    errorWrap(controls.list)
  );
  authenticatedRoutes.post(
    "/models/:modelId/controls",
    errorWrap(controls.create)
  );
  authenticatedRoutes.patch(
    "/models/:modelId/controls/:id",
    errorWrap(controls.update)
  );
  authenticatedRoutes.delete(
    "/models/:modelId/controls/:id",
    errorWrap(controls.delete)
  );

  // Mitigations
  const mitigations = mitigationsV1(dal);
  authenticatedRoutes.get(
    "/models/:modelId/mitigations",
    errorWrap(mitigations.list)
  );
  authenticatedRoutes.post(
    "/models/:modelId/mitigations",
    errorWrap(mitigations.create)
  );
  authenticatedRoutes.delete(
    "/models/:modelId/mitigations",
    errorWrap(mitigations.delete)
  );

  // Reviews
  const reviews = reviewsV1(dal);
  authenticatedRoutes.get("/reviews", errorWrap(reviews.list));
  authenticatedRoutes.get("/reviews/reviewers", errorWrap(reviews.reviewers));
  authenticatedRoutes.get("/reviews/:modelId", errorWrap(reviews.get));
  authenticatedRoutes.post("/reviews/:modelId", errorWrap(reviews.create));
  authenticatedRoutes.patch("/reviews/:modelId", errorWrap(reviews.patch));

  authenticatedRoutes.post(
    "/reviews/:modelId/cancel",
    errorWrap(reviews.cancel)
  );
  authenticatedRoutes.post(
    "/reviews/:modelId/decline",
    errorWrap(reviews.decline)
  );
  authenticatedRoutes.post(
    "/reviews/:modelId/approve",
    errorWrap(reviews.approve)
  );
  authenticatedRoutes.post(
    "/reviews/:modelId/request-meeting",
    errorWrap(reviews.requestMeeting)
  );
  authenticatedRoutes.post(
    "/reviews/:modelId/change-reviewer",
    errorWrap(reviews.changeReviewer)
  );

  // Suggestions
  const suggestions = suggestionsV1(dal);
  authenticatedRoutes.patch(
    "/suggestions/:modelId/accept",
    errorWrap(suggestions.accept)
  );
  authenticatedRoutes.patch(
    "/suggestions/:modelId/reject",
    errorWrap(suggestions.reject)
  );
  authenticatedRoutes.patch(
    "/suggestions/:modelId/reset",
    errorWrap(suggestions.reset)
  );
  authenticatedRoutes.get("/suggestions/:modelId", errorWrap(suggestions.list));

  // System Properties
  authenticatedRoutes.get(
    "/system-properties/:id",
    cache,
    errorWrap(systemPropertyRoutes.get)
  );
  authenticatedRoutes.get(
    "/system-properties",
    cache,
    errorWrap(systemPropertyRoutes.properties)
  );

  // Component Classes
  authenticatedRoutes.get(
    "/component-class",
    cache,
    errorWrap(searchClasses(dal.ccHandler))
  );

  // Report Routes
  authenticatedRoutes.get(
    "/reports/system-compliance",
    cache,
    errorWrap(listSystemCompliance(dal))
  );

  // Admin Routes
  authenticatedRoutes.post(
    "/admin/set-roles",
    authz.is(Role.Admin),
    errorWrap(setRoles)
  );
  authenticatedRoutes.get(
    "/admin/crash",
    authz.is(Role.Admin),
    errorWrap(crash)
  );
  authenticatedRoutes.post(
    "/admin/retry_review_approval",
    authz.is(Role.Admin),
    errorWrap(retryReviewApproval(dal))
  );

  app.use("/api/v1", unauthenticatedRoutes);
  app.use("/api/v1", authenticatedRoutes);

  // Serve Assets
  app.use(
    "/assets",
    express.static(AssetDir, { index: false, maxAge: 60 * 60 * 1000 })
  );

  // Static routes and Frontend
  if (process.env.SERVE_FRONTEND) {
    app.get("*", (_, res) =>
      res.sendFile(path.resolve("frontend", "index.html"))
    );
  }

  // Sentry Error Handler
  app.use(Sentry.Handlers.errorHandler());
  // Global Error Handler. Should catch anything that propagates up from the REST routes.
  app.use(errorHandler);

  // Return dal here for help injecting mocks into testing later. Not the best solution but should work.
  return app;
}

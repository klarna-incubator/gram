import { AssetDir } from "@gram/core/dist/Bootstrapper.js";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import { config } from "@gram/core/dist/config/index.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import express from "express";
import log4js from "log4js";
import path from "path";
import { metricsMiddleware } from "./metrics/metrics.js";
import {
  authRequiredMiddleware,
  validateTokenMiddleware,
} from "./middlewares/auth.js";
import { AuthzMiddleware } from "./middlewares/authz.js";
import cacheMw from "./middlewares/cache.js";
import errorHandler from "./middlewares/errorHandler.js";
import loggerMw from "./middlewares/logger.js";
import { securityHeaders } from "./middlewares/securityHeaders.js";
import { actionItemRouter } from "./resources/gram/v1/action-items/router.js";
import crash from "./resources/gram/v1/admin/crash.js";
import { retryReviewApproval } from "./resources/gram/v1/admin/retryReviewApproval.js";
import setRoles from "./resources/gram/v1/admin/setRoles.js";
import { getBanner } from "./resources/gram/v1/banners/get.js";
import { searchClasses } from "./resources/gram/v1/component-classes/search.js";
import { getContact } from "./resources/gram/v1/contact/get.js";
import controlsV1 from "./resources/gram/v1/controls/index.js";
import { linksRouter } from "./resources/gram/v1/links/router.js";
import { getMenu } from "./resources/gram/v1/menu/get.js";
import { mitigationsV1 } from "./resources/gram/v1/mitigations/index.js";
import { modelsRouter } from "./resources/gram/v1/models/router.js";
import { listSystemCompliance } from "./resources/gram/v1/reports/system-compliance.js";
import reviewsV1 from "./resources/gram/v1/reviews/index.js";
import suggestionsV1 from "./resources/gram/v1/suggestions/index.js";
import systemPropertyRoutesV1 from "./resources/gram/v1/system-properties/index.js";
import { getTeam } from "./resources/gram/v1/team/get.js";
import threatsV1 from "./resources/gram/v1/threats/index.js";
import tokenV1 from "./resources/gram/v1/token/index.js";
import { errorWrap } from "./util/errorHandler.js";
import { initSentry } from "./util/sentry.js";
import { userRouter } from "./resources/gram/v1/user/router.js";
import { searchRouter } from "./resources/gram/v1/search/router.js";
import { systemsRouter } from "./resources/gram/v1/systems/router.js";
import { validationRouter } from "./resources/gram/v1/validation/router.js";
import { getFlowAttributes } from "./resources/gram/v1/attributes/get.js";
import { flowsRouter } from "./resources/gram/v1/flows/router.js";

export async function createApp(dal: DataAccessLayer) {
  // Start constructing the app.
  const app = express();

  // Sentry has to be set up before everything else.
  initSentry();

  // Metrics middleware
  app.use(metricsMiddleware);

  // JSON middleware to automatically parse incoming requests
  app.use(express.json());
  app.use(cookieParser());
  app.use(securityHeaders());

  const loggerMwOpts = {
    logger: log4js.getLogger("auditHttp"),
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
  unauthenticatedRoutes.get("/contact", errorWrap(getContact));
  unauthenticatedRoutes.get("/attributes/flow", getFlowAttributes);

  const tokenRoutes = tokenV1(dal);
  unauthenticatedRoutes.get("/auth/token", errorWrap(tokenRoutes.get));
  unauthenticatedRoutes.post("/auth/token", errorWrap(tokenRoutes.get));
  unauthenticatedRoutes.get("/auth/params", errorWrap(tokenRoutes.params));
  unauthenticatedRoutes.delete("/auth/token", errorWrap(tokenRoutes.delete));

  // Authenticated routes
  const authenticatedRoutes = express.Router();
  authenticatedRoutes.use(authRequiredMiddleware);
  authenticatedRoutes.use("/user", userRouter(dal));

  // Search
  authenticatedRoutes.use("/search", searchRouter(dal));

  // Systems
  authenticatedRoutes.use("/systems", systemsRouter(dal));

  // Models
  authenticatedRoutes.use("/models", modelsRouter(dal));

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

  // Action Items
  authenticatedRoutes.use("/action-items", actionItemRouter(dal));

  // Links
  authenticatedRoutes.use("/links", linksRouter(dal));

  // Flows
  authenticatedRoutes.use("/flows", flowsRouter(dal));

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

  // Team
  authenticatedRoutes.get("/teams/:id", cache, errorWrap(getTeam(dal)));

  // Component Classes
  authenticatedRoutes.get(
    "/component-class",
    cache,
    errorWrap(searchClasses(dal.ccHandler))
  );

  // Model Validation
  authenticatedRoutes.use("/validate", validationRouter(dal));

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
  if (config.sentryDSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  // Global Error Handler. Should catch anything that propagates up from the REST routes.
  app.use(errorHandler);

  // Return dal here for help injecting mocks into testing later. Not the best solution but should work.
  return app;
}

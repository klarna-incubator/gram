import { AssetDir } from "@gram/core/dist/Bootstrapper.js";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import { config } from "@gram/core/dist/config/index.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import * as Sentry from "@sentry/node";
import express from "express";
import log4js from "log4js";
import path from "path";
import { metricsMiddleware } from "./middlewares/metrics.js";
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
import { getFlowAttributes } from "./resources/gram/v1/attributes/get.js";
import { getBanner } from "./resources/gram/v1/banners/get.js";
import { searchClasses } from "./resources/gram/v1/component-classes/search.js";
import { getContact } from "./resources/gram/v1/contact/get.js";
import { controlsRouter } from "./resources/gram/v1/controls/router.js";
import { flowsRouter } from "./resources/gram/v1/flows/router.js";
import { linksRouter } from "./resources/gram/v1/links/router.js";
import { getMenu } from "./resources/gram/v1/menu/get.js";
import { mitigationsRouter } from "./resources/gram/v1/mitigations/router.js";
import { modelsRouter } from "./resources/gram/v1/models/router.js";
import { listSystemCompliance } from "./resources/gram/v1/reports/system-compliance.js";
import { resourceMatchingRouter } from "./resources/gram/v1/resource-matching/router.js";
import { resourceRouter } from "./resources/gram/v1/resources/router.js";
import { reviewsRouter } from "./resources/gram/v1/reviews/router.js";
import { searchRouter } from "./resources/gram/v1/search/router.js";
import { suggestionsRouter } from "./resources/gram/v1/suggestions/router.js";
import { systemPropertiesRouter } from "./resources/gram/v1/system-properties/router.js";
import { systemsRouter } from "./resources/gram/v1/systems/router.js";
import { getTeam } from "./resources/gram/v1/team/get.js";
import { threatsRouter } from "./resources/gram/v1/threats/router.js";
import { tokenRouter } from "./resources/gram/v1/token/router.js";
import { userRouter } from "./resources/gram/v1/user/router.js";
import { validationRouter } from "./resources/gram/v1/validation/router.js";
import { initSentry } from "./util/sentry.js";

export async function createApp(
  dal: DataAccessLayer
): Promise<Express.Application> {
  // Start constructing the app.
  const app = express();

  // Sentry has to be set up before everything else.
  initSentry();

  // Metrics middleware
  app.use(metricsMiddleware);

  // JSON middleware to automatically parse incoming requests
  app.use(express.json());
  // app.use((req, res, next) => { cookieParser()(req, res, next); });
  app.use(securityHeaders());

  const loggerMwOpts = {
    logger: log4js.getLogger("auditHttp"),
    ...config.log.auditHttp,
  };

  const authz = AuthzMiddleware({ dal });
  const cache = cacheMw();

  // Register Global Middleware
  app.use(validateTokenMiddleware);
  app.use(loggerMw(loggerMwOpts));
  app.use(express.static("frontend/"));
  app.use(authz);

  // Register Routes
  const unauthenticatedRoutes = express.Router();
  unauthenticatedRoutes.get("/banners", getBanner(dal));
  unauthenticatedRoutes.get("/menu", getMenu);
  unauthenticatedRoutes.get("/contact", getContact);
  unauthenticatedRoutes.get("/attributes/flow", getFlowAttributes);

  // Token (Auth) Routes
  unauthenticatedRoutes.use("/auth", tokenRouter(dal));

  // Authenticated routes
  const authenticatedRoutes = express.Router();
  authenticatedRoutes.use(authRequiredMiddleware);
  authenticatedRoutes.use("/user", userRouter(dal));

  // Search
  authenticatedRoutes.use("/search", searchRouter(dal));

  // Systems
  authenticatedRoutes.use("/systems", systemsRouter(dal));

  // Threats
  authenticatedRoutes.use("/models/:modelId/threats", threatsRouter(dal));

  // Controls
  authenticatedRoutes.use("/models/:modelId/controls", controlsRouter(dal));

  // Mitigations
  authenticatedRoutes.use(
    "/models/:modelId/mitigations",
    mitigationsRouter(dal)
  );

  // Models
  authenticatedRoutes.use("/models", modelsRouter(dal));

  // Action Items
  authenticatedRoutes.use("/action-items", actionItemRouter(dal));

  // Links
  authenticatedRoutes.use("/links", linksRouter(dal));

  // Flows
  authenticatedRoutes.use("/flows", flowsRouter(dal));

  // Reviews
  authenticatedRoutes.use("/reviews", reviewsRouter(dal));

  // Suggestions
  authenticatedRoutes.use("/suggestions", suggestionsRouter(dal));

  // System Properties
  authenticatedRoutes.use(
    "/system-properties",
    systemPropertiesRouter(dal, cache)
  );

  // Team
  authenticatedRoutes.get("/teams/:id", cache, getTeam(dal));

  // Component Classes
  authenticatedRoutes.get(
    "/component-class",
    cache,
    searchClasses(dal.ccHandler)
  );

  // Model Validation
  authenticatedRoutes.use("/validate", validationRouter(dal));

  // Resources
  authenticatedRoutes.use("/resources", resourceRouter(dal));

  // Resource Matching
  authenticatedRoutes.use("/resources-matching", resourceMatchingRouter(dal));

  // Report Routes
  authenticatedRoutes.get(
    "/reports/system-compliance",
    cache,
    listSystemCompliance(dal)
  );

  // Admin Routes
  authenticatedRoutes.post("/admin/set-roles", authz.is(Role.Admin), setRoles);
  authenticatedRoutes.get("/admin/crash", authz.is(Role.Admin), crash);
  authenticatedRoutes.post(
    "/admin/retry_review_approval",
    authz.is(Role.Admin),
    retryReviewApproval(dal)
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

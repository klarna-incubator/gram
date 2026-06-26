import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import { exportAdminActionItems } from "./export.js";
import { listAdminActionItems } from "./list.js";

/**
 * Admin-only action item tooling. Mounted under /admin/action-items behind an
 * admin-role gate in app.ts.
 */
export function adminActionItemsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", listAdminActionItems(dal));
  router.post("/export", exportAdminActionItems(dal));
  return router;
}

import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { listNotifications } from "./list.js";
import { deleteNotificationById } from "./delete.js";

/**
 * Admin-only action item tooling. Mounted under /admin/notifications behind an
 * admin-role gate in app.ts.
 */
export function adminNotificationRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", listNotifications(dal));
  router.delete("/:id", deleteNotificationById(dal));
  return router;
}

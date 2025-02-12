import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import { exportActionItem } from "./export.js";
import { listActionItems } from "./list.js";
import { listExporters } from "./listExporters.js";

export function actionItemRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/exporters", listExporters(dal));
  router.get("/:modelId", listActionItems(dal));
  router.post("/export", exportActionItem(dal));
  return router;
}

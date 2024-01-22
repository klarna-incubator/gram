import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import { exportActionItem } from "./export.js";
import { listActionItems } from "./list.js";
import { listExporters } from "./listExporters.js";

export function actionItemRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router();
  router.get("/exporters", errorWrap(listExporters(dal)));
  router.get("/:modelId", errorWrap(listActionItems(dal)));
  router.post("/export", errorWrap(exportActionItem(dal)));
  return router;
}

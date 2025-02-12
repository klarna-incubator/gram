import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import compliance from "./compliance.js";
import get from "./get.js";
import list from "./list.js";
import permissions from "./permissions.js";

export function systemsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", list(dal));
  router.get("/:id", get(dal));
  router.get("/:id/permissions", permissions(dal));
  router.get("/:id/compliance", compliance(dal));
  return router;
}

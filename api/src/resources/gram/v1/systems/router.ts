import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import compliance from "./compliance.js";
import get from "./get.js";
import list from "./list.js";
import permissions from "./permissions.js";

export function systemsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", errorWrap(list(dal)));
  router.get("/:id", errorWrap(get(dal)));
  router.get("/:id/permissions", errorWrap(permissions(dal)));
  router.get("/:id/compliance", errorWrap(compliance(dal)));
  return router;
}

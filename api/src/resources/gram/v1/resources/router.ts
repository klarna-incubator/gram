import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import { getResources } from "./resource.js";

export function resourceRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });

  router.get("/:id", getResources(dal));
  return router;
}

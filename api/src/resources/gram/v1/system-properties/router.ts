import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import { getProperties } from "./get.js";
import { listProperties } from "./properties.js";

export function systemPropertiesRouter(
  dal: DataAccessLayer,
  cache: express.Handler
): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/:id", cache, getProperties(dal));
  router.get("/", cache, listProperties(dal));

  return router;
}

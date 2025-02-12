import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import { getProperties } from "./get.js";
import { listProperties } from "./properties.js";

export function systemPropertiesRouter(dal: DataAccessLayer, cache: express.Handler): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get(
    "/:id",
    cache,
    errorWrap(getProperties(dal))
  );
  router.get(
    "/",
    cache,
    errorWrap(listProperties(dal))
  );

  return router;
}
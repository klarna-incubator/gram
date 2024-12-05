import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import { getResources } from "./resource.js";

export function resourceRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router();

  router.get("/:id", errorWrap(getResources(dal)));
  return router;
}

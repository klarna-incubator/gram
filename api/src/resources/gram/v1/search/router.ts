import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import { search } from "./search.js";
import { getSearchTypes } from "./types.js";

export function searchRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.post("/", search(dal));
  router.get("/types", getSearchTypes(dal)); // Model templates
  return router;
}

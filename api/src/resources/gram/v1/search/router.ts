import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import { search } from "./search.js";
import { getSearchTypes } from "./types.js";

export function searchRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router();
  router.post("/", errorWrap(search(dal)));
  router.get("/types", errorWrap(getSearchTypes(dal))); // Model templates
  return router;
}

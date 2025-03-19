import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { create } from "./create.js";
import { _delete } from "./delete.js";
import { list } from "./list.js";

import express from "express";

export function mitigationsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", list(dal));
  router.post("/", create(dal));
  router.delete("/", _delete(dal));
  return router;
}

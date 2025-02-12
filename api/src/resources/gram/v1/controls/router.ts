import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { create } from "./create.js";
import { _delete } from "./delete.js";
import { list } from "./list.js";

import express from "express";
import { update } from "./update.js";

export function controlsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", list(dal));
  router.post("/", create(dal));
  router.patch("/:id", update(dal));
  router.delete("/:id", _delete(dal));

  return router;
}

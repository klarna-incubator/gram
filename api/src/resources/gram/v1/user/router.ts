import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import { getById } from "./getById.js";
import get from "./get.js";

export function userRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", get);
  router.get("/:userId", getById(dal));
  return router;
}

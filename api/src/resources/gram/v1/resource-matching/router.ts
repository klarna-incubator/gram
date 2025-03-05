import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { createResourceMatching } from "./create.js";
import { listResourceMatching } from "./list.js";
import { deleteResourceMatching } from "./delete.js";

export function resourceMatchingRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });

  router.post("/:modelId", createResourceMatching(dal));
  router.get("/:modelId", listResourceMatching(dal));
  router.delete("/:modelId", deleteResourceMatching(dal));
  return router;
}

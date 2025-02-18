import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import { createResourceMatching } from "./create.js";
import { listResourceMatching } from "./list.js";
import { deleteResourceMatching } from "./delete.js";

export function resourceMatchingRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router();

  router.post("/:modelId", errorWrap(createResourceMatching(dal)));
  router.get("/:modelId", errorWrap(listResourceMatching(dal)));
  router.delete("/:modelId", errorWrap(deleteResourceMatching(dal)));
  return router;
}

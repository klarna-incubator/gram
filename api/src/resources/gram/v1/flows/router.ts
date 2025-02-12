import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { getFlows } from "./get.js";

import { insertFlow } from "./post.js";
import { deleteFlow } from "./delete.js";
import { patchFlow } from "./patch.js";

export function flowsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.delete("/:flowId", deleteFlow(dal));
  router.patch("/:flowId", patchFlow(dal));
  router.get("/model/:modelId/dataflow/:dataFlowId", getFlows(dal));
  router.post("/model/:modelId/dataflow/:dataFlowId", insertFlow(dal));
  return router;
}

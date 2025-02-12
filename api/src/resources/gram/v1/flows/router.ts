import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { getFlows } from "./get.js";
import { errorWrap } from "../../../../util/errorHandler.js";
import { insertFlow } from "./post.js";
import { deleteFlow } from "./delete.js";
import { patchFlow } from "./patch.js";

export function flowsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.delete("/:flowId", errorWrap(deleteFlow(dal)));
  router.patch("/:flowId", errorWrap(patchFlow(dal)));
  router.get("/model/:modelId/dataflow/:dataFlowId", errorWrap(getFlows(dal)));
  router.post(
    "/model/:modelId/dataflow/:dataFlowId",
    errorWrap(insertFlow(dal))
  );
  return router;
}

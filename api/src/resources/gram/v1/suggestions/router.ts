import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import accept from "./accept.js";
import list from "./list.js";
import reject from "./reject.js";
import reset from "./reset.js";

export function suggestionsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.patch(
    "/:modelId/accept",
    errorWrap(accept(dal))
  );
  router.patch(
    "/:modelId/reject",
    errorWrap(reject(dal))
  );
  router.patch(
    "/:modelId/reset",
    errorWrap(reset(dal))
  );
  router.get("/:modelId", errorWrap(list(dal)));

  return router;
}
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import accept from "./accept.js";
import list from "./list.js";
import reject from "./reject.js";
import reset from "./reset.js";

export function suggestionsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.patch("/:modelId/accept", accept(dal));
  router.patch("/:modelId/reject", reject(dal));
  router.patch("/:modelId/reset", reset(dal));
  router.get("/:modelId", list(dal));

  return router;
}

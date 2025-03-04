import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import { validateModel } from "./validateModel.js";

export function validationRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });

  router.get("/:id", validateModel(dal));
  return router;
}

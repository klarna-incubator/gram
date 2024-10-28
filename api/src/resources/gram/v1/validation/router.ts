import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import { validateModel } from "./validateModel.js";

export function validationRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router();

  router.get("/:id", errorWrap(validateModel(dal)));
  return router;
}

import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import { getById } from "./getById.js";
import get from "./get.js";

export function userRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router();
  router.get("/", errorWrap(get));
  router.get("/:userId", errorWrap(getById(dal)));
  return router;
}

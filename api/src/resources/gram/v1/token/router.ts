import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import deleteToken from "./delete.js";
import { getAuthToken } from "./get.js";
import getAuthParams from "./params.js";

export function tokenRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/auth/token", errorWrap(getAuthToken(dal)));
  router.post("/auth/token", errorWrap(getAuthToken(dal)));
  router.get("/auth/params", errorWrap(getAuthParams));
  router.delete("/auth/token", errorWrap(deleteToken));
  return router;
}
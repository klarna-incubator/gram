import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import deleteToken from "./delete.js";
import { getAuthToken } from "./get.js";
import getAuthParams from "./params.js";

export function tokenRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/token", getAuthToken(dal));
  router.post("/token", getAuthToken(dal));
  router.get("/params", getAuthParams);
  router.delete("/token", deleteToken);
  return router;
}

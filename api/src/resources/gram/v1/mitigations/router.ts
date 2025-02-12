import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { create } from "./create.js";
import { _delete } from "./delete.js";
import { list } from "./list.js";
import { errorWrap } from "../../../../util/errorHandler.js";
import express from "express";

export function mitigationsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get(
    "/",
    errorWrap(list(dal))
  );
  router.post(
    "/",
    errorWrap(create(dal))
  );
  router.delete(
    "/",
    errorWrap(_delete(dal))
  );
  return router;
}
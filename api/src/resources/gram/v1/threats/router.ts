import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { create } from "./create.js";
import { _delete } from "./delete.js";
import { list } from "./list.js";
import { errorWrap } from "../../../../util/errorHandler.js";
import express from "express";
import { update } from "./update.js";

export function threatsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });

  router.get("/", errorWrap(list(dal)));
  router.post(
    "/",
    errorWrap(create(dal))
  );
  router.patch(
    "/:threatId",
    errorWrap(update(dal))
  );
  router.delete(
    "/:threatId",
    errorWrap(_delete(dal))
  );

  return router;
}
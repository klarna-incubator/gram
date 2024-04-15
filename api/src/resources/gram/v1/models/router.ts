import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
import create from "./create.js";
import _delete from "./delete.js";
import get from "./get.js";
import list from "./list.js";
import patch from "./patch.js";
import permissions from "./permissions.js";
import setSystemId from "./setSystemId.js";
import setTemplate from "./setTemplate.js";
import templates from "./templates.js";
import setShouldReviewActionItems from "./setShouldReviewActionItems.js";

export function modelsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router();
  router.get("/", errorWrap(list(dal)));
  router.post("/", errorWrap(create(dal)));
  router.get("/templates", errorWrap(templates(dal))); // Model templates
  router.patch("/:id", errorWrap(patch(dal)));
  router.delete("/:id", errorWrap(_delete(dal)));
  router.get("/:id", errorWrap(get(dal)));
  router.patch("/:id/set-template", errorWrap(setTemplate(dal)));
  router.patch("/:id/set-system-id", errorWrap(setSystemId(dal)));
  router.get("/:id/permissions", errorWrap(permissions(dal)));
  router.patch(
    "/:id/set-should-review-action-items",
    errorWrap(setShouldReviewActionItems(dal))
  );
  return router;
}

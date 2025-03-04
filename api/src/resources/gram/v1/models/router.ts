import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

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
  const router = express.Router({ mergeParams: true });
  router.get("/", list(dal));
  router.post("/", create(dal));
  router.get("/templates", templates(dal)); // Model templates
  router.patch("/:id", patch(dal));
  router.delete("/:id", _delete(dal));
  router.get("/:id", get(dal));
  router.patch("/:id/set-template", setTemplate(dal));
  router.patch("/:id/set-system-id", setSystemId(dal));
  router.get("/:id/permissions", permissions(dal));
  router.patch(
    "/:id/set-should-review-action-items",
    setShouldReviewActionItems(dal)
  );
  return router;
}

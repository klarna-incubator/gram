import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";

import approve from "./approve.js";
import cancel from "./cancel.js";
import changeReviewer from "./changeReviewer.js";
import create from "./create.js";
import decline from "./decline.js";
import get from "./get.js";
import list from "./list.js";
import patch from "./patch.js";
import requestMeeting from "./requestMeeting.js";
import reviewers from "./reviewers.js";

export function reviewsRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", list(dal));
  router.get("/reviewers", reviewers(dal));
  router.get("/:modelId", get(dal));

  router.post("/:modelId/cancel", cancel(dal));
  router.post("/:modelId/decline", decline(dal));
  router.post("/:modelId/approve", approve(dal));
  router.post("/:modelId/request-meeting", requestMeeting(dal));
  router.post("/:modelId/change-reviewer", changeReviewer(dal));
  router.post("/:modelId", create(dal));
  router.patch("/:modelId", patch(dal));

  return router;
}

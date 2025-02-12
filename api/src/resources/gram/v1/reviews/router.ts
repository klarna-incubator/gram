import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { errorWrap } from "../../../../util/errorHandler.js";
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
  router.get("/", errorWrap(list(dal)));
  router.get("/reviewers", errorWrap(reviewers(dal)));
  router.get("/:modelId", errorWrap(get(dal)));
  router.post("/:modelId", errorWrap(create(dal)));
  router.patch("/:modelId", errorWrap(patch(dal)));
  router.post(
    "/:modelId/cancel",
    errorWrap(cancel(dal))
  );
  router.post(
    "/:modelId/decline",
    errorWrap(decline(dal))
  );
  router.post(
    "/:modelId/approve",
    errorWrap(approve(dal))
  );
  router.post(
    "/:modelId/request-meeting",
    errorWrap(requestMeeting(dal))
  );
  router.post(
    "/:modelId/change-reviewer",
    errorWrap(changeReviewer(dal))
  );

  return router;
}
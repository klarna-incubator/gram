import get from "./get.js";
import list from "./list.js";
import create from "./create.js";
import patch from "./patch.js";
import cancel from "./cancel.js";
import decline from "./decline.js";
import approve from "./approve.js";
import requestMeeting from "./requestMeeting.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import reviewers from "./reviewers.js";
import changeReviewer from "./changeReviewer.js";

export default (dal: DataAccessLayer) => ({
  get: get(dal),
  list: list(dal),
  create: create(dal),
  patch: patch(dal),
  cancel: cancel(dal),
  decline: decline(dal),
  approve: approve(dal),
  requestMeeting: requestMeeting(dal),
  reviewers: reviewers(dal),
  changeReviewer: changeReviewer(dal),
});

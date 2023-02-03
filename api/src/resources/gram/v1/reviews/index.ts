import get from "./get";
import list from "./list";
import create from "./create";
import patch from "./patch";
import cancel from "./cancel";
import decline from "./decline";
import approve from "./approve";
import requestMeeting from "./requestMeeting";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import reviewers from "./reviewers";
import changeReviewer from "./changeReviewer";

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

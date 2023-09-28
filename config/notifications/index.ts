import { EmailReviewApproved } from "./EmailReviewApproved.js";
import { EmailReviewCanceled } from "./EmailReviewCanceled.js";
import { EmailReviewDeclined } from "./EmailReviewDeclined.js";
import { EmailReviewMeetingRequested } from "./EmailReviewMeetingRequested.js";
import { EmailReviewMeetingRequestedReminder } from "./EmailReviewMeetingRequestedReminder.js";
import { EmailReviewRequested } from "./EmailReviewRequested.js";
import { EmailReviewRequestedReminder } from "./EmailReviewRequestedReminder.js";
import { EmailReviewerChanged } from "./EmailReviewerChanged.js";

export default [
  EmailReviewApproved(),
  EmailReviewCanceled(),
  EmailReviewDeclined(),
  EmailReviewMeetingRequested(),
  EmailReviewMeetingRequestedReminder(),
  EmailReviewRequested(),
  EmailReviewRequestedReminder(),
  EmailReviewerChanged(),
];

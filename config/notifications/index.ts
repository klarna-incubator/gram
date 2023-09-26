import { EmailReviewApproved } from "./EmailReviewApproved";
import { EmailReviewCanceled } from "./EmailReviewCanceled";
import { EmailReviewDeclined } from "./EmailReviewDeclined";
import { EmailReviewMeetingRequested } from "./EmailReviewMeetingRequested";
import { EmailReviewMeetingRequestedReminder } from "./EmailReviewMeetingRequestedReminder";
import { EmailReviewRequested } from "./EmailReviewRequested";
import { EmailReviewRequestedReminder } from "./EmailReviewRequestedReminder";
import { EmailReviewerChanged } from "./EmailReviewerChanged";

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

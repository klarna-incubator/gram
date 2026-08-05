import { EmailProviderTemplates } from "../EmailNotificationProvider.js";
import { renderReviewApprovedTemplate } from "./ReviewApproved.js";
import { renderReviewCanceledTemplate } from "./ReviewCanceled.js";
import { renderReviewDeclinedTemplate } from "./ReviewDeclined.js";
import { renderReviewMeetingRequestedTemplate } from "./ReviewMeetingRequested.js";
import { renderReviewMeetingRequestedReminderTemplate } from "./ReviewMeetingRequestedReminder.js";
import { renderReviewRequestedTemplate } from "./ReviewRequested.js";
import { renderReviewRequestedReminderTemplate } from "./ReviewRequestedReminder.js";
import { renderReviewReviewerChangedTemplate } from "./ReviewerChanged.js";

/**
 * The reference email rendering (Handlebars subject/body + recipients/cc) for
 * every core template key, ready to pass into EmailNotificationProvider's
 * constructor. Deployments needing custom copy can build their own
 * EmailProviderTemplates map with defineEmailTemplate instead.
 */
export const emailProviderTemplates: EmailProviderTemplates = {
  "review-approved": renderReviewApprovedTemplate,
  "review-canceled": renderReviewCanceledTemplate,
  "review-declined": renderReviewDeclinedTemplate,
  "review-meeting-requested": renderReviewMeetingRequestedTemplate,
  "review-meeting-requested-reminder":
    renderReviewMeetingRequestedReminderTemplate,
  "review-requested": renderReviewRequestedTemplate,
  "review-requested-reminder": renderReviewRequestedReminderTemplate,
  "review-reviewer-changed": renderReviewReviewerChangedTemplate,
};

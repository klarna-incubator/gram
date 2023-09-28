import { PlaintextHandlebarsNotificationTemplate } from "../notifications/NotificationTemplate.js";

const key = "review-approved";

const subject = `{{model.name}} threat model approved!`;

const template = `
{{review}}
`.trim();

export const SampleEmailReviewApproved =
  new PlaintextHandlebarsNotificationTemplate(
    "review-approved",
    subject,
    template,
    async (dal, variables) => {
      return {
        cc: [],
        recipients: [variables.review.requestedBy, variables.review.reviewer],
        ...variables,
      };
    }
  );

export const SampleEmailMeetingRequested =
  new PlaintextHandlebarsNotificationTemplate(
    "review-meeting-requested",
    subject,
    template,
    async (dal, variables) => {
      return {
        cc: [],
        recipients: [variables.review.requestedBy, variables.review.reviewer],
        ...variables,
      };
    }
  );

export const SampleEmailRequested = new PlaintextHandlebarsNotificationTemplate(
  "review-requested",
  subject,
  template,
  async (dal, variables) => {
    return {
      cc: [],
      recipients: [variables.review.requestedBy, variables.review.reviewer],
      ...variables,
    };
  }
);

import { defineEmailTemplate } from "../EmailNotificationProvider.js";

const subject = `{{model.name}} threat model review was canceled`;

const template = `
Hi {{reviewer.name}} and {{requester.name}}!

This email is just to let you know the threat model review of {{model.name}} was canceled. This means
that the requesting team or reviewer team no longer wants to have the threat model reviewed.

If you want to re-open the review of the threat model, you can simply re-request a review from the model's diagram:
{{model.link}}

`.trim();

export const renderReviewCanceledTemplate = defineEmailTemplate(
  subject,
  template,
  (base) => {
    const cc = [base.requester];
    const recipients = [base.reviewer];

    return {
      cc,
      recipients,
      ...base,
    };
  }
);

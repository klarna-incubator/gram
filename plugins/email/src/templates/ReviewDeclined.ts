import {
  EmailRecipient,
  defineEmailTemplate,
} from "../EmailNotificationProvider.js";

const subject = `{{model.name}} request for threat model review declined`;

const template = `
Hi {{requester.name}}!

{{previousReviewer.name}} has declined your request to review the threat model of {{model.name}}.

It has been automatically re-assigned to {{reviewer.name}}, however if you have a specific reviewer
you would like to review your model, feel free to assign it to them instead.
`.trim();

export const renderReviewDeclinedTemplate = defineEmailTemplate(
  subject,
  template,
  (base) => {
    const recipients: EmailRecipient[] = [base.requester];
    const cc: EmailRecipient[] = [base.reviewer];
    if (base.previousReviewer?.email) {
      cc.push(base.previousReviewer);
    }
    return {
      cc,
      recipients,
      ...base,
    };
  }
);

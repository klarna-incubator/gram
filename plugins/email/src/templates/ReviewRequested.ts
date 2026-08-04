import { defineEmailTemplate } from "../EmailNotificationProvider.js";

const subject = `{{model.name}} threat model review requested`;

const template = `
Hi {{reviewer.name}}!

{{requester.name}} has requested a review for the threat model of {{model.name}}.

You can access and review the threat model here: {{model.link}}

If you are unable to complete this review, please decline the review in Gram{{#if contact.name}} or reach out to {{contact.name}}{{/if}}.

Thank you.
`.trim();

export const renderReviewRequestedTemplate = defineEmailTemplate(
  subject,
  template,
  (base) => {
    const cc = [base.requester];
    if (base.owner.email && base.owner.email !== "UNDEFINED") {
      cc.push(base.owner);
    }
    const recipients = [base.reviewer];

    return {
      cc,
      recipients,
      ...base,
    };
  }
);

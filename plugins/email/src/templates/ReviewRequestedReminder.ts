import { defineEmailTemplate } from "../EmailNotificationProvider.js";
const subject = `Reminder: {{model.name}} threat model review requested`;

const template = `
Hi {{reviewer.name}}!

This is a reminder that {{requester.name}} has requested a review for the threat model of {{model.name}}.

You can access and review the threat model here: {{model.link}}

Please complete this review {{#if reassignAfterDays}} within {{reassignAfterDays}} days{{/if}}, or the review will be automatically reassigned.

If you are unable to complete this review, please decline the review in Gram{{#if contact.name}} or reach out to {{contact.name}}{{/if}}.

Thank you.
`.trim();

export const renderReviewRequestedReminderTemplate = defineEmailTemplate(
  subject,
  template,
  (base) => {
    const recipients = [base.requester];
    if (base.owner.email && base.owner.email !== "UNDEFINED") {
      recipients.push(base.owner);
    }
    const cc = base.contact?.email ? [base.contact] : [];
    return {
      cc,
      recipients,
      ownerIsNotRequester: base.requester.email != base.owner.email,
      ...base,
    };
  }
);

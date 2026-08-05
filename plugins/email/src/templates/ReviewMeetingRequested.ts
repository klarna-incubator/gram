import { defineEmailTemplate } from "../EmailNotificationProvider.js";

const subject = `{{model.name}} threat model was not approved`;

const template = `
Hi {{owner.name}}{{#if ownerIsNotRequester}} and {{requester.name}}{{/if}}!
{{#if missingTeamEmail}}{{missingTeamEmail}}{{/if}}
The threat model of {{model.name}} was reviewed by {{reviewer.name}} on {{review.updatedAt}}.
At this time, the threat model was not approved.

You can access and review the threat model here: {{model.link}}

To get approval, {{reviewer.name}} has requested that you schedule a review session to review the threat model.
{{#if sessionBookingLink}}
You can book a session here: {{sessionBookingLink}}
{{/if}}

{{#if review.note}}

{{reviewer.name}} left the following note for you:

{{review.note}}

{{/if}}

---

{{#if contact.name}}
Please reach out to {{contact.name}} with any further questions or feedback about the threat model review process.
{{/if}}
`.trim();

export const renderReviewMeetingRequestedTemplate = defineEmailTemplate(
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

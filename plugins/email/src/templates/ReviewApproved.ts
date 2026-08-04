import { defineEmailTemplate } from "../EmailNotificationProvider.js";

const subject = `{{model.name}} threat model approved!`;

const template = `
Hi {{requester.name}}!
{{#if missingTeamEmail}}{{missingTeamEmail}}{{/if}}
The threat model of {{model.name}} has been reviewed and approved by {{reviewer.name}} on {{review.approvedAt}}.

You can access and review the threat model here:
{{model.link}}

{{#if review.note}}

{{reviewer.name}} left the following note for you:

{{review.note}}

{{/if}}

---

Thank you for completing the threat model for {{model.name}}!
{{#if contact.name}}

Please reach out to {{contact.name}} with any further questions or feedback about this process.
{{/if}}
`.trim();

export const renderReviewApprovedTemplate = defineEmailTemplate(
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
  },
);

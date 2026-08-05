import { defineEmailTemplate } from "../EmailNotificationProvider.js";

const subject = `Reminder to schedule threat model meeting for {{model.name}}`;

const template = `
Hi {{owner.name}}{{#if ownerIsNotRequester}} and {{requester.name}}{{/if}}!

{{#if missingTeamEmail}}{{missingTeamEmail}}{{/if}}

We would like to remind you that you still have to schedule a threat model meeting for {{model.name}} and
it has been more than {{remindEveryXDays}} days since the meeting was requested ({{review.meetingRequestedAt}}).
{{#if sessionBookingLink}}
You can book a session here: {{sessionBookingLink}}
{{/if}}

If you no longer need the review, please use the cancel review option on the left side panel.

You can access and review the threat model here: {{model.link}}

{{#if review.note}}

{{reviewer.name}} left the following note for you:

{{review.note}}

{{/if}}

---
{{#if contact.name}}
Please reach out to {{contact.name}} with any further questions or feedback about the threat model review process.
{{/if}}
`.trim();

export const renderReviewMeetingRequestedReminderTemplate = defineEmailTemplate(
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

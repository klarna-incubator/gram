import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate";
import { generalReviewNotificationVariables } from "./util";

const key = "review-meeting-requested-reminder";

const subject = `Reminder to schedule threat model for {{model.name}}`;

// Can try to update this template later to automagically create the construction method by using a Template literal
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
const template = `
Hi {{requester.name}}!  

We would like to remind you that you still have to schedule a threat model for {{model.name}} and it has been more than 60 days since the meeting was requested ({{review.meetingRequestedAt}}).
To get approval, please schedule a review session using the link below. 
Please use the cancel review option on the left side panel if you want to cancel the review.

You can access and review the threat model here: {{model.link}}

{{#if review.note}}

{{reviewer.name}} left the following note for you:

{{review.note}}

{{/if}}

`.trim();

export const EmailReviewMeetingRequestedReminder = () =>
  new PlaintextHandlebarsNotificationTemplate(
    key,
    subject,
    template,
    async (dal, { review }) => {
      const variables = await generalReviewNotificationVariables(dal, review);
      const recipients = [variables.requester];

      return {
        cc: [],
        recipients,
        ...variables,
      };
    }
  );

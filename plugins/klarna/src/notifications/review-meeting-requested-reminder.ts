import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate";
import { fallbackReviewer } from "../KlarnaReviewerProvider";
import { OctaneSystemProvider } from "../system/OctaneSystemProvider";
import { CoolestTeam, generalReviewNotificationVariables } from "./util";

const key = "review-meeting-requested-reminder";

const subject = `Reminder to schedule threat model for {{model.name}}`;

// Can try to update this template later to automagically create the construction method by using a Template literal
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
const template = `
Hi {{owner.name}}{{#if ownerIsNotRequester}} and {{requester.name}}{{/if}}!  
{{#if missingTeamEmail}}{{missingTeamEmail}}{{/if}}

We would like to remind you that you still have to schedule a threat model for {{model.name}} and it has been more than 60 days since the meeting was requested ({{review.meetingRequestedAt}}).
To get approval, please schedule a review session using the link below. 
Please use the cancel review option on the left side panel if you want to cancel the review.

You can access and review the threat model here: {{model.link}}

{{#if review.note}}

{{reviewer.name}} left the following note for you:

{{review.note}}

{{/if}}

{{#if reviewIsSecDev}}
Please schedule a session by selecting a slot on this calendar: 
https://calendar.google.com/calendar/selfsched?sstoken=UUdBOVg2MXlrZ0k1fGRlZmF1bHR8YTQ2YzFlODRlMDk1OGI0YTkxYjY2ZjE5MzljNWQxYzU  
{{/if}}

---
    
Please reach out to the Secure Development team at  #team-ea-secure-development with any further questions or feedback about this process. 
`.trim();

export const EmailReviewMeetingRequestedReminder = (
  systemProvider: OctaneSystemProvider
) =>
  new PlaintextHandlebarsNotificationTemplate(
    key,
    subject,
    template,
    async (dal, { review }) => {
      const variables = await generalReviewNotificationVariables(
        dal,
        review,
        systemProvider
      );
      const recipients = [variables.requester];
      if (variables.owner.email && variables.owner.email !== "UNDEFINED") {
        recipients.push(variables.owner);
      }
      return {
        cc: [CoolestTeam],
        recipients,
        ownerIsNotRequester: variables.requester.email != variables.owner.email,
        reviewIsSecDev: review?.reviewedBy === fallbackReviewer.sub,
        ...variables,
      };
    }
  );

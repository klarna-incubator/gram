import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate";
import { CoolestTeam, generalReviewNotificationVariables } from "./util";

const key = "review-meeting-requested-reminder";

const subject = `Reminder to schedule threat model meeting for {{model.name}}`;

const template = `
Hi {{owner.name}}{{#if ownerIsNotRequester}} and {{requester.name}}{{/if}}!  

{{#if missingTeamEmail}}{{missingTeamEmail}}{{/if}}

We would like to remind you that you still have to schedule a threat model meeting for {{model.name}} and 
it has been more than 60 days since the meeting was requested ({{review.meetingRequestedAt}}). 

If you no longer need the review, please use the cancel review option on the left side panel.

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

export const EmailReviewMeetingRequestedReminder = () =>
  new PlaintextHandlebarsNotificationTemplate(
    key,
    subject,
    template,
    async (dal, { review }) => {
      const variables = await generalReviewNotificationVariables(dal, review);
      const recipients = [variables.requester];
      if (variables.owner.email && variables.owner.email !== "UNDEFINED") {
        recipients.push(variables.owner);
      }
      return {
        cc: [CoolestTeam],
        recipients,
        ownerIsNotRequester: variables.requester.email != variables.owner.email,
        reviewIsSecDev:
          review?.reviewedBy ===
          (await dal.reviewerHandler.getFallbackReviewer({}))?.mail,
        ...variables,
      };
    }
  );

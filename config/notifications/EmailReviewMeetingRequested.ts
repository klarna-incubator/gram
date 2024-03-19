import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate.js";
import { generalReviewNotificationVariables, CoolestTeam } from "./util.js";

const key = "review-meeting-requested";

const subject = `{{model.name}} threat model was not approved`;

// Can try to update this template later to automagically create the construction method by using a Template literal
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
const template = `
Hi {{owner.name}}{{#if ownerIsNotRequester}} and {{requester.name}}{{/if}}!  
{{#if missingTeamEmail}}{{missingTeamEmail}}{{/if}}
The threat model of {{model.name}} was reviewed by {{reviewer.name}} on {{review.updatedAt}}. 
At this time, the threat model was not approved. 

You can access and review the threat model here: {{model.link}}
    
To get approval, {{reviewer.name}} has requested that you schedule a review session to review the threat model. 

{{#if review.note}}

{{reviewer.name}} left the following note for you:

{{review.note}}

{{/if}}

{{#if reviewIsSecDev}}
Please schedule a session by selecting a slot on this calendar: 
https://calendar.google.com/calendar/selfsched?sstoken=UUdBOVg2MXlrZ0k1fGRlZmF1bHR8YTQ2YzFlODRlMDk1OGI0YTkxYjY2ZjE5MzljNWQxYzU  
{{/if}}

---
    
Please reach out to the Secure Development team at  #tm-secure-development-dm-kep with any further questions or feedback about this process. 
`.trim();

export const EmailReviewMeetingRequested = () =>
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

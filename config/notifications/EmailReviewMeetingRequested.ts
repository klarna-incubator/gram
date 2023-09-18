import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate";
import { generalReviewNotificationVariables } from "./util";

const key = "review-meeting-requested";

const subject = `{{model.name}} threat model was not approved`;

// Can try to update this template later to automagically create the construction method by using a Template literal
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
const template = `
Hi {{requester.name}}!  

The threat model of {{model.name}} was reviewed by {{reviewer.name}} on {{review.updatedAt}}. 
At this time, the threat model was not approved. 

You can access and review the threat model here: {{model.link}}
    
To get approval, {{reviewer.name}} has requested that you schedule a review session to review the threat model. 

{{#if review.note}}

{{reviewer.name}} left the following note for you:

{{review.note}}

{{/if}}

`.trim();

export const EmailReviewMeetingRequested = () =>
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

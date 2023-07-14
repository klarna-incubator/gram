import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate";
import { generalReviewNotificationVariables } from "./util";

const key = "review-requested";

const subject = `{{model.name}} threat model review requested`;

const template = `
Hi {{reviewer.name}}! 
 
{{requester.name}} has requested a review for the threat model of {{model.name}}. 
 
You can access and review the threat model here: {{model.link}}
 
Please complete this review within 14 days.

Thank you.
`.trim();

export const EmailReviewRequested = () =>
  new PlaintextHandlebarsNotificationTemplate(
    key,
    subject,
    template,
    async (dal, { review }) => {
      const variables = await generalReviewNotificationVariables(dal, review);
      const cc = [variables.requester];
      const recipients = [variables.reviewer];

      return {
        cc,
        recipients,
        ...variables,
      };
    }
  );

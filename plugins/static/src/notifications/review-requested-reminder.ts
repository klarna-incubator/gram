import { NotificationTemplateKey } from "gram-api/src/data/notifications/NotificationInput";
import { PlaintextHandlebarsNotificationTemplate } from "gram-api/src/notifications/NotificationTemplate";
import { generalReviewNotificationVariables } from "./util";

const key: NotificationTemplateKey = "review-requested-reminder";

const subject = `Reminder: {{model.name}} threat model review requested`;

const template = `
Hi {{reviewer.name}}! 

This is a reminder that {{requester.name}} has requested a review for the threat model of {{model.name}}. 
 
You can access and review the threat model here: {{model.link}}

Thank you.
`.trim();

export const EmailReviewRequestedReminder = () =>
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

import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate";
import { generalReviewNotificationVariables } from "./util";

const key = "review-declined";

const subject = `{{model.name}} request for threat model review declined`;

const template = `
Hi {{requester.name}}!

{{reviewer.name}} has declined your request to review the threat model of {{model.name}}. 

It has been automatically re-assigned to {{fallbackReviewer.name}}
 `.trim();

export const EmailReviewDeclined = () =>
  new PlaintextHandlebarsNotificationTemplate(
    key,
    subject,
    template,
    async (dal, { review }) => {
      const variables = await generalReviewNotificationVariables(dal, review);
      const recipients = [variables.requester];

      return {
        cc: [variables.reviewer],
        recipients,
        ...variables,
      };
    }
  );

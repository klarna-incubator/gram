import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate";
import { generalReviewNotificationVariables } from "./util";

const key = "review-declined";

const subject = `{{model.name}} request for threat model review declined`;

const template = `
Hi {{requester.name}}!

{{reviewer.name}} has declined your request to review for the threat model of {{model.name}}. 

You will need to find a different reviewer to complete the review.
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

import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate.js";
import { generalReviewNotificationVariables } from "./util.js";

const key = "review-canceled";

const subject = `{{model.name}} threat model review was canceled`;

const template = `
Hi {{reviewer.name}} and {{requester.name}}!

This email is just to let you know the threat model review of {{model.name}} was canceled. This means
that the requesting team no longer wants to have the threat model reviewed.

If you want to re-open the review of the threat model, you can simply re-request a review from the model's diagram: 
{{model.link}}
 
`.trim();

export const EmailReviewCanceled = () =>
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

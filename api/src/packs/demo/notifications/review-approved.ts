import { PlaintextHandlebarsNotificationTemplate } from "../../../notifications/NotificationTemplate";
import { generalReviewNotificationVariables } from "./util";

const key = "review-approved";

const subject = `{{model.name}} threat model approved!`;

const template = `
Hi {{requester.name}}!

The threat model of {{model.name}} has been reviewed and approved by {{reviewer.name}} on {{review.approvedAt}}. 

You can access and review the threat model here: 
{{model.link}}

{{#if review.note}}

{{reviewer.name}} left the following note for you:

{{review.note}}

{{/if}}

---

Thank you for completing the threat model for {{model.name}}!
 
`.trim();

export const EmailReviewApproved = () =>
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

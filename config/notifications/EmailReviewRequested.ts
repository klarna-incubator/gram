import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate.js";
import { generalReviewNotificationVariables } from "./util.js";

const key = "review-requested";

const subject = `{{model.name}} threat model review requested`;

const template = `
Hi {{reviewer.name}}! 
 
{{requester.name}} has requested a review for the threat model of {{model.name}}. 
 
You can access and review the threat model here: {{model.link}}
 
Please complete this review within 14 days.

You can refer to this playbook ({{playbookLink}}) on how to perform threat model reviews.

If you are unable to complete this review, please decline the review in Gram or reach out to the Secure Development team at #team-ea-secure-development. 

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
      if (variables.owner.email && variables.owner.email !== "UNDEFINED") {
        cc.push(variables.owner);
      }
      const recipients = [variables.reviewer];

      return {
        cc,
        recipients,
        ...variables,
      };
    }
  );

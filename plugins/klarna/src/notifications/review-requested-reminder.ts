import { NotificationTemplateKey } from "gram-api/src/data/notifications/NotificationInput";
import { PlaintextHandlebarsNotificationTemplate } from "gram-api/src/notifications/NotificationTemplate";
import { fallbackReviewer } from "../KlarnaReviewerProvider";
import { OctaneSystemProvider } from "../system/OctaneSystemProvider";
import { CoolestTeam, generalReviewNotificationVariables } from "./util";

const key: NotificationTemplateKey = "review-requested-reminder";

const subject = `Reminder: {{model.name}} threat model review requested`;

const template = `
Hi {{reviewer.name}}! 

This is a reminder that {{requester.name}} has requested a review for the threat model of {{model.name}}. 
 
You can access and review the threat model here: {{model.link}}
 
Please complete this review within 14 days, or the review will be automatically reassigned to the Secure Development team.

You can refer to this playbook ({{playbookLink}}) on how to perform threat model reviews.

If you are unable to complete this review, please decline the review in Gram or reach out to the Secure Development team at #team-ea-secure-development. 

Thank you.
`.trim();

export const EmailReviewRequestedReminder = (
  systemProvider: OctaneSystemProvider
) =>
  new PlaintextHandlebarsNotificationTemplate(
    key,
    subject,
    template,
    async (dal, { review }) => {
      const variables = await generalReviewNotificationVariables(
        dal,
        review,
        systemProvider
      );
      const recipients = [variables.requester];
      if (variables.owner.email && variables.owner.email !== "UNDEFINED") {
        recipients.push(variables.owner);
      }
      return {
        cc: [CoolestTeam],
        recipients,
        ownerIsNotRequester: variables.requester.email != variables.owner.email,
        reviewIsSecDev: review?.reviewedBy === fallbackReviewer.sub,
        ...variables,
      };
    }
  );

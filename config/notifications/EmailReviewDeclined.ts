import {
  EmailRecipient,
  PlaintextHandlebarsNotificationTemplate,
} from "@gram/core/dist/notifications/NotificationTemplate";
import { generalReviewNotificationVariables } from "./util";

const key = "review-declined";

const subject = `{{model.name}} request for threat model review declined`;

const template = `
Hi {{requester.name}}!

{{previousReviewer.name}} has declined your request to review the threat model of {{model.name}}. 

It has been automatically re-assigned to {{reviewer.name}}, however if you have a specific DSL or Security Champion 
who you would like to review your model, feel free to assign it to them instead.
 `.trim();

export const EmailReviewDeclined = () =>
  new PlaintextHandlebarsNotificationTemplate(
    key,
    subject,
    template,
    async (dal, { review, previousReviewer }) => {
      const variables = await generalReviewNotificationVariables(dal, review);
      const recipients: EmailRecipient[] = [variables.requester];
      const cc: EmailRecipient[] = [variables.reviewer];
      const previousReviewerLookup = await dal.reviewerHandler.lookupReviewer(
        {},
        previousReviewer
      );
      const previous: EmailRecipient = {
        name: "unknown",
      };
      if (previousReviewerLookup) {
        previous.name = previousReviewerLookup.name;
        previous.email = previousReviewerLookup.mail;

        if (previous.email) {
          cc.push(previous);
        }
      }
      return {
        cc,
        recipients,
        ...variables,
        previousReviewer: previous,
      };
    }
  );

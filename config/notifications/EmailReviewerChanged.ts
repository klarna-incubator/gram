import { NotificationTemplateKey } from "@gram/core/dist/data/notifications/NotificationInput.js";
import {
  EmailRecipient,
  PlaintextHandlebarsNotificationTemplate,
} from "@gram/core/dist/notifications/NotificationTemplate.js";
import { generalReviewNotificationVariables } from "./util.js";

const key: NotificationTemplateKey = "review-reviewer-changed";

const subject = `{{model.name}} threat model reassigned`;

const template = `
Hi {{reviewer.name}} and {{previousReviewer.name}}! 

This email is to inform you that the threat model {{model.name}} ({{model.link}}) was just reassigned from 
{{previousReviewer.name}} to {{reviewer.name}}. 

Happy reviewing!
`.trim();

export const EmailReviewerChanged = () =>
  new PlaintextHandlebarsNotificationTemplate(
    key,
    subject,
    template,
    async (dal, { review, previousReviewer }) => {
      const variables = await generalReviewNotificationVariables(dal, review);
      const recipients: EmailRecipient[] = [variables.reviewer];
      const cc = [variables.requester];
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
          recipients.push(previous);
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

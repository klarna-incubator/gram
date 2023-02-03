import { NotificationTemplateKey } from "@gram/core/dist/data/notifications/NotificationInput";
import { lookupReviewers } from "@gram/core/dist/data/reviews/ReviewerProvider";
import {
  EmailRecipient,
  PlaintextHandlebarsNotificationTemplate,
} from "@gram/core/dist/notifications/NotificationTemplate";
import { generalReviewNotificationVariables } from "./util";

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
      const previousReviewerLookup = await lookupReviewers(previousReviewer);
      const previous: EmailRecipient = {
        name: "unknown",
      };
      if (previousReviewerLookup && previousReviewerLookup.length > 0) {
        previous.name = previousReviewerLookup[0].name;
        previous.email = previousReviewerLookup[0].mail;

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

import { PlaintextHandlebarsNotificationTemplate } from "gram-api/src/notifications/NotificationTemplate";
import { OctaneSystemProvider } from "../system/OctaneSystemProvider";
import { CoolestTeam, generalReviewNotificationVariables } from "./util";

const key = "review-approved";

const subject = `{{model.name}} threat model approved!`;

const template = `
Hi {{owner.name}}{{#if ownerIsNotRequester}} and {{requester.name}}{{/if}}! 
{{#if missingTeamEmail}}{{missingTeamEmail}}{{/if}}
The threat model of {{model.name}} has been reviewed and approved by {{reviewer.name}} on {{review.approvedAt}}. 

You can access and review the threat model here: 
{{model.link}}

Gram is under active development and we are looking for YOUR feedback. Please take 45 seconds to give us your thoughts and suggestions here:
https://docs.google.com/forms/d/e/1FAIpQLSfVTLCR_VHTzIhDZ8MRFLpfm58LNlf0zICS2brYMOok7LrURA/viewform?usp=sf_link

{{#if review.note}}

{{reviewer.name}} left the following note for you:

{{review.note}}

{{/if}}

---

Thank you for completing the threat model for {{model.name}}!
 
Please reach out to the Secure Development team at #team-ea-secure-development with any further questions or feedback about this process. 
`.trim();

export const EmailReviewApproved = (systemProvider: OctaneSystemProvider) =>
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
        ...variables,
      };
    }
  );

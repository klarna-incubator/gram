import {
  EmailRecipient,
  defineEmailTemplate,
} from "../EmailNotificationProvider.js";

const subject = `{{model.name}} threat model reassigned`;

const template = `
Hi {{reviewer.name}} and {{previousReviewer.name}}!

This email is to inform you that the threat model {{model.name}} ({{model.link}}) was just reassigned from
{{previousReviewer.name}} to {{reviewer.name}}.

Happy reviewing!
`.trim();

export const renderReviewReviewerChangedTemplate = defineEmailTemplate(
  subject,
  template,
  (base) => {
    const recipients: EmailRecipient[] = [base.reviewer];
    if (base.previousReviewer?.email) {
      recipients.push(base.previousReviewer);
    }

    const cc = [base.requester];
    if (base.owner.email && base.owner.email !== "UNDEFINED") {
      cc.push(base.owner);
    }

    return {
      cc,
      recipients,
      ...base,
    };
  }
);

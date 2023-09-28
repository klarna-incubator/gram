import { PlaintextHandlebarsNotificationTemplate } from "@gram/core/dist/notifications/NotificationTemplate.js";

const key = "magic-link";

const subject = `Sign-in to Gram`;

const template = `
Hello {{recipientName}},

You or somone else is requesting to access your account via sign-in link. To access your account, simply click on the unique link provided below:

🔗 {{link}} 🔐

Please keep this link confidential and avoid sharing it with others. It is exclusively meant for your personal use.
`.trim();

export const MagicLinkEmail = () =>
  new PlaintextHandlebarsNotificationTemplate(
    key,
    subject,
    template,
    async (dal, { recipientName, link, recipient }) => {
      const recipients = [recipient];

      return {
        recipients,
        cc: [],
        link,
        recipientName,
      };
    }
  );

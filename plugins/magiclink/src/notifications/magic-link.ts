import { defineEmailTemplate, EmailRecipient } from "@gram/email";

const subject = "Your Gram sign-in link";

const template = `
Hi!

Click the link below to sign in to Gram:

{{link}}

If you didn't request this, you can safely ignore this email.
`.trim();

/**
 * Renders the magic-link login email. A deployment wanting the email channel
 * to deliver this must merge it into whatever `EmailProviderTemplates` map it
 * passes to `EmailNotificationProvider`, e.g.
 * `{ ...emailProviderTemplates, "magic-link": renderMagicLinkTemplate }`.
 */
export const renderMagicLinkTemplate = defineEmailTemplate(
  subject,
  template,
  (base) => {
    const recipient: EmailRecipient = { email: base.recipient?.to };
    return {
      ...base,
      recipients: [recipient],
      cc: [],
    };
  }
);

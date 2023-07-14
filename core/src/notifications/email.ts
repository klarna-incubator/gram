import { Message, SMTPClient } from "emailjs";
import { Notification } from "../data/notifications/Notification";
import { getLogger } from "log4js";
import { TemplateHandler } from "./TemplateHandler";
import { sanitizeEmail } from "../util/sanitize";
import { config } from "../config";

const log = getLogger("email");

const senderName = config.notifications.providers.email.senderName || "Gram";

// Allow overriding recipient email for debug purposes.
const overrideMail =
  config.notifications.providers.email.overrideRecipient || false;

/**
 * Sanitizes recipient names by removing special email characters.
 *
 * Unicode names are... complicated. So we do a blocklist approach here
 * Reference: https://datatracker.ietf.org/doc/html/rfc2822#section-3
 *
 * @param rawRecipient
 * @returns recipient name with special characters removed
 */
export function sanitizeRecipientName(rawRecipient?: string) {
  if (!rawRecipient) return "";
  return rawRecipient.replace(/[:()<>[\];@\\,."\n\r\t]/gu, "");
}

export async function send(
  client: SMTPClient,
  templateHandler: TemplateHandler,
  notification: Notification
): Promise<boolean> {
  const content = templateHandler.render(
    notification.templateKey,
    notification.variables
  );

  const msg: Message = new Message({
    text: content.body,
    from: `${sanitizeRecipientName(senderName)} <${client.smtp.user()}>`,
    to: notification.variables.recipients.map(
      (r) =>
        `${sanitizeRecipientName(r.name)} <${sanitizeEmail(
          overrideMail || r.email
        )}>`
    ),
    cc: notification.variables.cc.map(
      (cc) =>
        `${sanitizeRecipientName(cc.name)} <${sanitizeEmail(
          overrideMail || cc.email
        )}>`
    ),
    subject: content.subject,
    content: "text/plain; charset=utf-8", // Warning: If you change this be aware that the template render function does not escape HTML!
  });

  log.debug(`Sending mail: ${JSON.stringify(msg, null, 2)}`);

  return !!(await client.sendAsync(msg));
}

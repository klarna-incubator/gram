import { SMTPClient } from "emailjs";
import { NotificationDataService } from "../data/notifications/NotificationDataService";
import { getLogger } from "log4js";
import { send } from "./email";
import { TemplateHandler } from "./TemplateHandler";
import { config } from "../config";

const log = getLogger("NotificationSender");

export async function notificationSender(
  notificationService: NotificationDataService,
  templateHandler: TemplateHandler
) {
  const notifications = await notificationService.pollNewNotifications();

  if (notifications.length === 0) {
    log.debug("No new notifications to send");
    return;
  }

  const host = await config.notifications.providers.email.host.getValue();

  const port = parseInt(
    (await config.notifications.providers.email.port.getValue()) || "25"
  );
  const user = await config.notifications.providers.email.user.getValue();
  const password =
    await config.notifications.providers.email.password.getValue();

  const client = new SMTPClient({
    user,
    password,
    host,
    port,
    tls: true, // NOT OPTIONAL 🙅
  });

  const result = await Promise.all(
    notifications.map(async (notification) => {
      const result = { id: notification.id, success: false };
      try {
        result.success = await send(client, templateHandler, notification);
      } catch (err: any) {
        log.error(
          `Failed to send notification ${notification.id}: SMTP Error Code: ${err?.code}. See https://github.com/eleith/emailjs/blob/main/smtp/error.ts`
        );
        result.success = false;
      }
      return result;
    })
  );

  // Mark successful mails as sent.
  const successfulMails = result
    .filter((n) => n.success)
    .map((n) => <number>n.id);
  if (successfulMails.length > 0) {
    log.info(`Sent notifications [${successfulMails.join(",")}]`);
    await notificationService.updateStatus(successfulMails, "sent");
  }

  // Mark failed emails
  const failedEmails = result
    .filter((n) => !n.success)
    .map((n) => <number>n.id);
  if (failedEmails.length > 0) {
    log.warn(`Failed to send notifications [${failedEmails.join(",")}]`);
    await notificationService.updateStatus(failedEmails, "failed");
  }
}

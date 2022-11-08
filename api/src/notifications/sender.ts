import { SMTPClient } from "emailjs";
import { NotificationDataService } from "../data/notifications/NotificationDataService";
import { getLogger } from "../logger";
import secrets from "../secrets";
import { send } from "./email";
import { TemplateHandler } from "./TemplateHandler";

const log = getLogger("NotificationSender");

export async function notificationSender(
  notificationService: NotificationDataService,
  templateHandler: TemplateHandler
) {
  const host = await secrets.get("notifications.providers.email.host");
  const port = parseInt(
    await secrets.getOrDefault("notifications.providers.email.port", "25")
  );
  const user = await secrets.get("notifications.providers.email.user");
  const password = await secrets.getOrDefault(
    "notifications.providers.email.password",
    undefined
  );

  const client = new SMTPClient({
    user,
    password,
    host,
    port,
    tls: true, // NOT OPTIONAL 🙅
  });

  const notifications = await notificationService.pollNewNotifications();

  if (notifications.length === 0) {
    log.debug("No new notifications to send");
    return;
  }

  const result = await Promise.all(
    notifications.map(async (notification) => {
      const result = { id: notification.id, success: false };
      try {
        result.success = await send(client, templateHandler, notification);
      } catch (err: any) {
        log.error(
          `Failed to send notification ${notification.id}: ${err}\n${err.stack}`
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

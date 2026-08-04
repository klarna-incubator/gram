import log4js from "log4js";
import { NotificationDataService } from "../data/notifications/NotificationDataService.js";
import {
  Notification,
  NotificationStatus,
} from "../data/notifications/Notification.js";
import {
  DeliveryOutcome,
  NotificationProvider,
} from "./NotificationProvider.js";

const log = log4js.getLogger("notificationHandler");

const outcomeToStatus: Record<DeliveryOutcome, NotificationStatus> = {
  sent: "sent",
  failed: "failed",
  dropped: "dropped",
};

/**
 * Routes each given row to the one registered NotificationProvider whose `key`
 * matches the row's `type` - fan-out already happened at queue time
 * (NotificationDataService.queue() creates one row per registered provider), so
 * this is 1:1 routing, not a broadcast - and updates each row's status from the
 * resolved outcome. Shared by notificationHandler and notificationRetryHandler;
 * the only difference between them is which status they poll rows in.
 */
async function processNotifications(
  notificationService: NotificationDataService,
  providers: Map<string, NotificationProvider>,
  notifications: Notification[]
) {
  const outcomes = await Promise.all(
    notifications.map(async (notification) => {
      const id = notification.id as number;
      const provider = providers.get(notification.type);

      if (!provider) {
        log.info(
          `No registered provider for notification - reporting dropped`,
          {
            meta: {
              notificationId: id,
              notificationType: notification.type,
            },
          }
        );
        return { id, outcome: "dropped" as DeliveryOutcome };
      }

      const outcome = await provider.handle(
        notification.templateKey,
        notification.variables,
        id
      );
      return { id, outcome };
    })
  );

  const idsByOutcome: Record<DeliveryOutcome, number[]> = {
    sent: [],
    failed: [],
    dropped: [],
  };
  outcomes.forEach(({ id, outcome }) => idsByOutcome[outcome].push(id));

  if (idsByOutcome.sent.length > 0) {
    log.info(`Sent notifications`, {
      payload: {
        ids: idsByOutcome.sent,
      },
    });
    await notificationService.updateStatus(
      idsByOutcome.sent,
      outcomeToStatus.sent
    );
  }

  if (idsByOutcome.failed.length > 0) {
    log.warn(`Failed to send notifications`, {
      payload: {
        ids: idsByOutcome.failed,
      },
    });
    await notificationService.updateStatus(
      idsByOutcome.failed,
      outcomeToStatus.failed
    );
  }

  if (idsByOutcome.dropped.length > 0) {
    log.info(`Dropped notifications`, {
      payload: {
        ids: idsByOutcome.dropped,
      },
    });
    await notificationService.updateStatus(
      idsByOutcome.dropped,
      outcomeToStatus.dropped
    );
  }
}

/**
 * Polls queued notifications and routes each to its matching provider.
 *
 * Always polls, regardless of how many providers are currently registered
 * (including zero) - this is deliberate: it's what lets rows orphaned by removing
 * every provider from config still be found and resolved to `dropped`, rather than
 * being left stuck in `new` status forever.
 */
export async function notificationHandler(
  notificationService: NotificationDataService,
  providers: Map<string, NotificationProvider>
) {
  const notifications = await notificationService.pollNewNotifications();

  if (notifications.length === 0) {
    log.debug("No new notifications to process");
    return;
  }

  await processNotifications(notificationService, providers, notifications);
}

/**
 * Polls previously-failed notifications and retries them via the same
 * routing/outcome logic as notificationHandler - a row that failed due to a
 * transient transport error gets another attempt; a row whose provider no longer
 * exists resolves to `dropped` on this pass instead of remaining `failed` forever.
 * There is no attempt limit or backoff - every currently-failed row is retried on
 * every run.
 */
export async function notificationRetryHandler(
  notificationService: NotificationDataService,
  providers: Map<string, NotificationProvider>
) {
  const notifications = await notificationService.pollFailedNotifications();

  if (notifications.length === 0) {
    log.debug("No failed notifications to retry");
    return;
  }

  await processNotifications(notificationService, providers, notifications);
}

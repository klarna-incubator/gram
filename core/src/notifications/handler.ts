import log4js from "log4js";
import { NotificationDataService } from "../data/notifications/NotificationDataService.js";
import { Notification } from "../data/notifications/Notification.js";
import {
  DispatchResult,
  NotificationProvider,
  StatusCheckResult,
} from "./NotificationProvider.js";

const log = log4js.getLogger("notificationHandler");

const DEFAULT_PENDING_LEASE_MS = 60 * 1000;
const DEFAULT_CONFIRMATION_ATTEMPT_CAP = 5;

export type NotificationHandlerConfig = {
  notificationNewInterval: number;
  notificationFailedInterval: number;
  notificationPendingInterval: number;
  notificationPendingLease: number;
  notificationConfirmationAttemptCap: number;
  notificationCleanUpInterval: number;
  notificationCleanUpThreshold: number;
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
  // Process notifications and get the outcome of each notification
  const outcomes = await Promise.all(
    notifications.map(async (notification) => {
      const id = notification.id as number;
      const provider = providers.get(notification.type);

      if (!provider) {
        log.info("Dropped notification", {
          meta: { notificationId: id, provider: notification.type },
          payload: { reason: "no registered provider" },
        });
        return { id, result: { outcome: "dropped" } as DispatchResult };
      }

      const result = await provider.handle(
        notification.templateKey,
        notification.variables,
        id
      );
      return { id, result };
    })
  );
  // Group notifications by outcome
  const idsByOutcome: Record<DispatchResult["outcome"], number[]> = {
    sent: [],
    failed: [],
    dropped: [],
    "awaiting-confirmation": [],
  };
  const providerRefById = new Map<number, string>();

  outcomes.forEach(({ id, result }) => {
    idsByOutcome[result.outcome].push(id);
    if (result.outcome === "awaiting-confirmation" && result.ref) {
      providerRefById.set(id, result.ref);
    }
  });
  // Update status for notifications that were sent
  if (idsByOutcome.sent.length > 0) {
    await notificationService.updateStatus(idsByOutcome.sent, "sent");
    log.info("Sent notification", {
      meta: {},
      payload: {
        notificationIds: idsByOutcome.sent,
        count: idsByOutcome.sent.length,
      },
    });
  }
  // Update status for notifications that failed to send
  if (idsByOutcome.failed.length > 0) {
    await notificationService.updateStatus(idsByOutcome.failed, "failed");
    log.warn("Failed to send notification", {
      meta: {},
      payload: {
        notificationIds: idsByOutcome.failed,
        count: idsByOutcome.failed.length,
      },
    });
  }
  // Update status for notifications that were dropped
  if (idsByOutcome.dropped.length > 0) {
    await notificationService.updateStatus(idsByOutcome.dropped, "dropped");
    log.info("Dropped notification", {
      meta: {},
      payload: {
        notificationIds: idsByOutcome.dropped,
        count: idsByOutcome.dropped.length,
      },
    });
  }
  // Update status for notifications that are awaiting confirmation
  // Persist the provider ref for notifications that were awaiting confirmation
  const awaitingIds = idsByOutcome["awaiting-confirmation"];
  if (awaitingIds.length > 0) {
    for (const id of awaitingIds) {
      const providerRef = providerRefById.get(id);
      if (providerRef) {
        await notificationService.persistProviderRef(id, providerRef);
      }
    }
    // The claim already set `pending`. Refresh it so the confirmation lease
    // starts after dispatch, and do not count a confirmation attempt.
    await notificationService.updateStatus(awaitingIds, "pending");
    log.info("Left notification pending", {
      meta: {},
      payload: { notificationIds: awaitingIds, count: awaitingIds.length },
    });
  }
}

export async function notificationHandler(
  notificationService: NotificationDataService,
  providers: Map<string, NotificationProvider>,
  userDefinedHandlerConfig: Partial<NotificationHandlerConfig>
) {
  const defaultHandlerConfig: NotificationHandlerConfig = {
    notificationNewInterval: 1000 * 60 * 1, // 1 minute
    notificationFailedInterval: 1000 * 60 * 20, // 20 minutes
    notificationPendingInterval: 1000 * 60 * 5, // 5 minutes
    notificationPendingLease: 60 * 1000, // 1 minute
    notificationConfirmationAttemptCap: 5,
    notificationCleanUpInterval: 1000 * 60 * 60 * 24, // 1 day
    notificationCleanUpThreshold: 1000 * 60 * 60 * 24 * 7, // 1 week
  };

  const config: NotificationHandlerConfig = {
    ...defaultHandlerConfig,
    ...userDefinedHandlerConfig,
  };

  log.info("Notification handler initialized with config", {
    meta: {},
    payload: {
      config,
    },
  });

  // Poll new notifications
  setInterval(
    () => notificationNewHandler(notificationService, providers),
    config.notificationNewInterval
  );
  // Poll failed notifications
  setInterval(
    () => notificationFailedHandler(notificationService, providers),
    config.notificationFailedInterval
  );
  // Poll pending notifications
  setInterval(
    () =>
      notificationPendingHandler(notificationService, providers, {
        leaseMs: config.notificationPendingLease,
        maxConfirmationAttempts: config.notificationConfirmationAttemptCap,
      }),
    config.notificationPendingInterval
  );
  // Clean up notifications
  setInterval(
    () => notificationCleanupHandler(notificationService, config),
    config.notificationCleanUpInterval
  );
}

/**
 * Polls queued notifications and routes each to its matching provider.
 *
 * Always polls, regardless of how many providers are currently registered
 * (including zero) - this is deliberate: it's what lets rows orphaned by removing
 * every provider from config still be found and resolved to `dropped`, rather than
 * being left stuck in `new` status forever.
 */
export async function notificationNewHandler(
  notificationService: NotificationDataService,
  providers: Map<string, NotificationProvider>
) {
  const notifications = await notificationService.pollNewNotifications();
  log.info("Polled notification", {
    meta: { status: "new" },
    payload: { count: notifications.length },
  });
  if (notifications.length === 0) {
    return;
  }

  await processNotifications(notificationService, providers, notifications);
}

/**
 * Polls previously-failed notifications that never obtained a provider ref and
 * retries them via the same routing/outcome logic as notificationHandler. A
 * `failed` row that already has a ref is a confirmation failure and is not
 * selected. A row whose provider no longer exists resolves to `dropped`.
 */
export async function notificationFailedHandler(
  notificationService: NotificationDataService,
  providers: Map<string, NotificationProvider>
) {
  const notifications = await notificationService.pollFailedNotifications();
  log.info("Polled notification", {
    meta: { status: "failed" },
    payload: { count: notifications.length },
  });
  if (notifications.length === 0) {
    return;
  }

  await processNotifications(notificationService, providers, notifications);
}

export type PendingHandlerOptions = {
  leaseMs?: number;
  maxConfirmationAttempts?: number;
};

/**
 * Confirms stale `pending` rows without dispatching again when a provider ref
 * is already stored.
 * - no ref → `new`, so the new-row poller can dispatch
 * - ref + delivered → `sent`
 * - ref + still in flight → stay `pending`, count a confirmation attempt;
 *   at the cap → `dropped`
 * - ref + failed or unknown to the provider → `failed` (never `new`)
 * - provider has no `checkStatus` → leave the row alone (no status API call)
 */
export async function notificationPendingHandler(
  notificationService: NotificationDataService,
  providers: Map<string, NotificationProvider>,
  options: PendingHandlerOptions = {}
) {
  const leaseMs = options.leaseMs ?? DEFAULT_PENDING_LEASE_MS;
  const maxConfirmationAttempts =
    options.maxConfirmationAttempts ?? DEFAULT_CONFIRMATION_ATTEMPT_CAP;

  const notifications = await notificationService.pollStalePendingNotifications(
    leaseMs
  );
  log.info("Polled notification", {
    meta: { status: "pending" },
    payload: { count: notifications.length },
  });

  if (notifications.length === 0) {
    return;
  }

  const reclaimIds: number[] = [];
  const sentIds: number[] = [];
  const failedIds: number[] = [];
  const droppedIds: number[] = [];

  await Promise.all(
    notifications.map(async (notification) => {
      const id = notification.id as number;

      if (!notification.providerRef) {
        reclaimIds.push(id);
        return;
      }

      const provider = providers.get(notification.type);
      if (!provider?.checkStatus) {
        log.warn("Skipped notification confirmation", {
          meta: { notificationId: id, provider: notification.type },
          payload: { reason: "provider does not implement checkStatus" },
        });
        return;
      }

      let status: StatusCheckResult;
      try {
        status = await provider.checkStatus(notification.providerRef);
      } catch (err: any) {
        log.error("Failed to check notification status", {
          meta: { notificationId: id, provider: provider.key },
          payload: {
            error: err?.message || String(err),
            errorCode: err?.code,
          },
        });
        return;
      }

      if (status.outcome === "sent") {
        sentIds.push(id);
        return;
      }

      if (status.outcome === "failed" || status.outcome === "missing_ref") {
        if (status.outcome === "missing_ref") {
          log.warn("Failed to confirm notification", {
            meta: { notificationId: id, provider: notification.type },
            payload: {
              providerRef: notification.providerRef,
              outcome: "missing_ref",
            },
          });
        }
        failedIds.push(id);
        return;
      }

      const attempts = await notificationService.incrementConfirmationAttempts(
        id
      );
      if (attempts >= maxConfirmationAttempts) {
        droppedIds.push(id);
      }
    })
  );

  if (reclaimIds.length > 0) {
    await notificationService.reclaimPendingAsNew(reclaimIds);
    log.info("Reclaimed notification", {
      meta: { status: "new" },
      payload: { notificationIds: reclaimIds, count: reclaimIds.length },
    });
  }

  if (sentIds.length > 0) {
    await notificationService.updateStatus(sentIds, "sent");
    log.info("Confirmed notification", {
      meta: { status: "sent" },
      payload: { notificationIds: sentIds, count: sentIds.length },
    });
  }

  if (failedIds.length > 0) {
    await notificationService.updateStatus(failedIds, "failed");
    log.warn("Failed to confirm notification", {
      meta: { status: "failed" },
      payload: { notificationIds: failedIds, count: failedIds.length },
    });
  }

  if (droppedIds.length > 0) {
    await notificationService.updateStatus(droppedIds, "dropped");
    log.warn("Dropped notification", {
      meta: { status: "dropped" },
      payload: {
        notificationIds: droppedIds,
        count: droppedIds.length,
        reason: "confirmation attempts exceeded",
      },
    });
  }
}

/**
 * Delete notification rows older than the retention window, regardless of status - a
 * retention backstop, not a substitute for the failed/stalled health checks.
 */
export async function notificationCleanUpHandler(
  notificationService: NotificationDataService,
  handlerConfig: NotificationHandlerConfig
) {
  await notificationService.deleteOlderThan(
    new Date(Date.now() - handlerConfig.notificationCleanUpThreshold)
  );
}

export async function notificationCleanupHandler(
  notificationService: NotificationDataService,
  handlerConfig: NotificationHandlerConfig
) {
  await notificationService.deleteOlderThan(
    new Date(Date.now() - handlerConfig.notificationCleanUpThreshold)
  );
}

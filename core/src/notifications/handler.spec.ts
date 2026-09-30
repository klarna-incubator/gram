import { jest } from "@jest/globals";
import { DataAccessLayer } from "../data/dal.js";
import { NotificationDataService } from "../data/notifications/NotificationDataService.js";
import { NotificationInput } from "../data/notifications/NotificationInput.js";
import { createPostgresPool } from "../data/postgres.js";
import {
  notificationHandler,
  notificationNewHandler,
  notificationPendingHandler,
  notificationFailedHandler,
} from "./handler.js";
import { FakeNotificationProvider } from "../test-util/FakeNotificationProvider.js";

describe("notificationNewHandler", () => {
  let notificationService: NotificationDataService;
  let dal: DataAccessLayer;
  let provider: FakeNotificationProvider;

  const sampleNotification: NotificationInput = {
    templateKey: "review-approved",
    variables: { name: "hello" },
  };

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    notificationService = new NotificationDataService(dal);
  });

  beforeEach(async () => {
    await notificationService._truncate();
    provider = new FakeNotificationProvider("fake");
    dal.notificationProviders.clear();
    dal.notificationProviders.set("fake", provider);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  it("should mark notifications as sent", async () => {
    provider.sendResult = { outcome: "sent" };
    const [nid] = await notificationService.queue(sampleNotification);

    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("sent");
  });

  it("should mark notifications that returned failed as failed", async () => {
    provider.sendResult = { outcome: "failed" };
    const [nid] = await notificationService.queue(sampleNotification);

    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("failed");
  });

  it("should mark notifications that errored as failed", async () => {
    provider.sendImpl = async () => {
      throw new Error("kaboom");
    };
    const [nid] = await notificationService.queue(sampleNotification);

    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("failed");
  });

  it("should mark notifications with an explicit drop marker as dropped", async () => {
    const droppingProvider = new FakeNotificationProvider("fake", {
      kind: "drop",
    });
    dal.notificationProviders.set("fake", droppingProvider);

    const [nid] = await notificationService.queue(sampleNotification);

    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("dropped");
  });

  it("should run ok with no notifications queued", async () => {
    await expect(
      notificationNewHandler(notificationService, dal.notificationProviders)
    ).resolves.not.toThrow();
  });

  it("should only send once", async () => {
    provider.sendResult = { outcome: "sent" };
    await notificationService.queue(sampleNotification);

    for (let i = 0; i < 3; i++) {
      await notificationNewHandler(
        notificationService,
        dal.notificationProviders
      );
    }

    const notifications = await notificationService.pollNewNotifications();
    expect(notifications.length).toBe(0);
  });

  it("should still poll when zero providers are registered", async () => {
    dal.notificationProviders.clear();

    const spy = jest.spyOn(notificationService, "pollNewNotifications");
    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should drop a row whose type matches no registered provider", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    // Simulate the provider that would have handled this row being removed from
    // config after the row was created.
    dal.notificationProviders.clear();

    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("dropped");
  });

  it("should drop orphaned rows even when the registry is completely empty on a later run", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    dal.notificationProviders.clear();

    // First run: registry is fully empty, but polling still happens and the row
    // resolves to dropped rather than being left in `new` forever.
    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("dropped");
  });

  it("should not let one provider's render() throw take down the rest of the batch", async () => {
    const goodProvider = new FakeNotificationProvider("good");
    const badProvider = new FakeNotificationProvider("bad");
    badProvider.renderError = new Error(
      '"name" not defined in [object Object]'
    );
    dal.notificationProviders.clear();
    dal.notificationProviders.set("good", goodProvider);
    dal.notificationProviders.set("bad", badProvider);

    // Fans out to both providers registered above - one row per provider.
    const [goodId, badId] = await notificationService.queue(sampleNotification);

    await expect(
      notificationNewHandler(notificationService, dal.notificationProviders)
    ).resolves.not.toThrow();

    const good = await notificationService.getNotification(goodId);
    const bad = await notificationService.getNotification(badId);
    expect(good.status).toBe("sent");
    expect(bad.status).toBe("failed");
  });
});

describe("notificationFailedHandler", () => {
  let notificationService: NotificationDataService;
  let dal: DataAccessLayer;
  let provider: FakeNotificationProvider;

  const sampleNotification: NotificationInput = {
    templateKey: "review-approved",
    variables: { name: "hello" },
  };

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    notificationService = new NotificationDataService(dal);
  });

  beforeEach(async () => {
    await notificationService._truncate();
    provider = new FakeNotificationProvider("fake");
    dal.notificationProviders.clear();
    dal.notificationProviders.set("fake", provider);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  it("should not touch new notifications, only failed ones", async () => {
    const [nid] = await notificationService.queue(sampleNotification);

    await notificationFailedHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("new");
  });

  it("should retry a failed notification and mark it sent on success", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.updateStatus([nid], "failed");
    provider.sendResult = { outcome: "sent" };

    await notificationFailedHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("sent");
  });

  it("should leave a notification failed if the retry also fails", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.updateStatus([nid], "failed");
    provider.sendResult = { outcome: "failed" };

    await notificationFailedHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("failed");
  });

  it("should drop a failed notification whose provider no longer exists", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.updateStatus([nid], "failed");
    dal.notificationProviders.clear();

    await notificationFailedHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("dropped");
  });

  it("should run ok with no failed notifications", async () => {
    await expect(
      notificationFailedHandler(notificationService, dal.notificationProviders)
    ).resolves.not.toThrow();
  });

  it("should not redispatch a failed notification that already has a provider ref", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.updateStatus([nid], "failed");
    await notificationService.persistProviderRef(nid, "req-1");
    let dispatched = false;
    provider.sendImpl = async () => {
      dispatched = true;
      return { outcome: "failed" };
    };

    await notificationFailedHandler(
      notificationService,
      dal.notificationProviders
    );

    expect(dispatched).toBe(false);
    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("failed");
    expect(notification.providerRef).toBe("req-1");
  });
});

describe("notificationPendingHandler", () => {
  let notificationService: NotificationDataService;
  let dal: DataAccessLayer;
  let provider: FakeNotificationProvider;

  const sampleNotification: NotificationInput = {
    templateKey: "review-approved",
    variables: { name: "hello" },
  };

  const leaseMs = 60 * 1000;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    notificationService = new NotificationDataService(dal);
  });

  beforeEach(async () => {
    await notificationService._truncate();
    provider = new FakeNotificationProvider("fake");
    dal.notificationProviders.clear();
    dal.notificationProviders.set("fake", provider);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  async function age(id: number) {
    await dal.pool.query(
      `UPDATE notifications
       SET updated_at = current_timestamp - interval '5 minutes'
       WHERE id = $1`,
      [id]
    );
  }

  it("uses the configured lease and attempt cap in the scheduled confirmation job", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.persistProviderRef(nid, "req-1");
    await notificationService.updateStatus([nid], "pending");
    await age(nid);
    provider.checkStatus = async () => ({ outcome: "pending" });

    const intervals = jest
      .spyOn(globalThis, "setInterval")
      .mockImplementation(() => ({} as ReturnType<typeof setInterval>));
    let pendingTick: () => Promise<void>;
    try {
      await notificationHandler(
        notificationService,
        dal.notificationProviders,
        {
          notificationPendingInterval: 1234,
          notificationPendingLease: 1000,
          notificationConfirmationAttemptCap: 1,
        }
      );
      const call = intervals.mock.calls.find(([, delay]) => delay === 1234);
      expect(call).toBeDefined();
      pendingTick = call![0] as () => Promise<void>;
    } finally {
      intervals.mockRestore();
    }

    const poll = jest.spyOn(
      notificationService,
      "pollStalePendingNotifications"
    );
    try {
      await pendingTick!();
      expect(poll).toHaveBeenCalledWith(1000);
      const notification = await notificationService.getNotification(nid);
      expect(notification.status).toBe("dropped");
      expect(notification.confirmationAttempts).toBe(1);
    } finally {
      poll.mockRestore();
    }
  });

  it("leaves a dispatched row pending and stores the provider ref", async () => {
    provider.sendResult = { outcome: "awaiting-confirmation", ref: "req-1" };
    const [nid] = await notificationService.queue(sampleNotification);

    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("pending");
    expect(notification.providerRef).toBe("req-1");
    expect(notification.confirmationAttempts).toBe(0);
  });

  it("does not select a pending row that is still inside the lease", async () => {
    provider.sendResult = { outcome: "awaiting-confirmation", ref: "req-1" };
    provider.checkStatus = async () => {
      throw new Error("should not confirm an in-lease row");
    };
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    await notificationPendingHandler(
      notificationService,
      dal.notificationProviders,
      { leaseMs }
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("pending");
    expect(notification.providerRef).toBe("req-1");
  });

  it("marks a confirmed delivery sent without dispatching again", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.pollNewNotifications();
    await notificationService.persistProviderRef(nid, "req-1");
    await age(nid);
    provider.sendImpl = async () => {
      throw new Error("should not dispatch");
    };
    provider.checkStatus = async () => ({ outcome: "sent" });

    await notificationPendingHandler(
      notificationService,
      dal.notificationProviders,
      { leaseMs }
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("sent");
  });

  it("keeps a still-pending confirmation pending and counts the attempt", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.pollNewNotifications();
    await notificationService.persistProviderRef(nid, "req-1");
    await age(nid);
    provider.checkStatus = async () => ({ outcome: "pending" });

    await notificationPendingHandler(
      notificationService,
      dal.notificationProviders,
      { leaseMs }
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("pending");
    expect(notification.confirmationAttempts).toBe(1);
  });

  it("marks a failed confirmation failed", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.pollNewNotifications();
    await notificationService.persistProviderRef(nid, "req-1");
    await age(nid);
    provider.checkStatus = async () => ({ outcome: "failed" });

    await notificationPendingHandler(
      notificationService,
      dal.notificationProviders,
      { leaseMs }
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("failed");
  });

  it("marks an unknown provider ref failed and does not requeue it", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.pollNewNotifications();
    await notificationService.persistProviderRef(nid, "req-1");
    await age(nid);
    provider.checkStatus = async () => ({ outcome: "missing_ref" });

    await notificationPendingHandler(
      notificationService,
      dal.notificationProviders,
      { leaseMs }
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("failed");
    expect(notification.providerRef).toBe("req-1");
  });

  it("reclaims a stale pending row with no provider ref as new", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.pollNewNotifications();
    await age(nid);

    await notificationPendingHandler(
      notificationService,
      dal.notificationProviders,
      { leaseMs }
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("new");
    expect(notification.providerRef).toBeUndefined();
  });

  it("drops a pending row once confirmation attempts reach the cap", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.pollNewNotifications();
    await notificationService.persistProviderRef(nid, "req-1");
    await dal.pool.query(
      `UPDATE notifications SET confirmation_attempts = 4 WHERE id = $1`,
      [nid]
    );
    await age(nid);
    provider.sendImpl = async () => {
      throw new Error("should not dispatch");
    };
    provider.checkStatus = async () => ({ outcome: "pending" });

    await notificationPendingHandler(
      notificationService,
      dal.notificationProviders,
      { leaseMs }
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("dropped");
    expect(notification.confirmationAttempts).toBe(5);
  });

  it("leaves a pending row alone when the provider has no checkStatus", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.pollNewNotifications();
    await notificationService.persistProviderRef(nid, "req-1");
    await age(nid);

    await notificationPendingHandler(
      notificationService,
      dal.notificationProviders,
      { leaseMs }
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("pending");
    expect(notification.providerRef).toBe("req-1");
    expect(notification.confirmationAttempts).toBe(0);
  });

  it("leaves a pending row pending when checkStatus throws", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.pollNewNotifications();
    await notificationService.persistProviderRef(nid, "req-1");
    await age(nid);
    provider.checkStatus = async () => {
      throw new Error("status unavailable");
    };

    await notificationPendingHandler(
      notificationService,
      dal.notificationProviders,
      { leaseMs }
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("pending");
    expect(notification.confirmationAttempts).toBe(0);
  });

  it("leaves awaiting-confirmation without a ref pending and does not invent one", async () => {
    provider.sendResult = { outcome: "awaiting-confirmation" };
    const [nid] = await notificationService.queue(sampleNotification);

    await notificationNewHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("pending");
    expect(notification.providerRef).toBeUndefined();
    expect(notification.confirmationAttempts).toBe(0);
  });
});

import { jest } from "@jest/globals";
import { DataAccessLayer } from "../data/dal.js";
import { NotificationDataService } from "../data/notifications/NotificationDataService.js";
import { NotificationInput } from "../data/notifications/NotificationInput.js";
import { createPostgresPool } from "../data/postgres.js";
import { notificationHandler, notificationRetryHandler } from "./handler.js";
import { FakeNotificationProvider } from "../test-util/FakeNotificationProvider.js";

describe("notificationHandler", () => {
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
    provider.sendResult = true;
    const [nid] = await notificationService.queue(sampleNotification);

    await notificationHandler(notificationService, dal.notificationProviders);

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("sent");
  });

  it("should mark notifications that returned false as failed", async () => {
    provider.sendResult = false;
    const [nid] = await notificationService.queue(sampleNotification);

    await notificationHandler(notificationService, dal.notificationProviders);

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("failed");
  });

  it("should mark notifications that errored as failed", async () => {
    provider.sendImpl = async () => {
      throw new Error("kaboom");
    };
    const [nid] = await notificationService.queue(sampleNotification);

    await notificationHandler(notificationService, dal.notificationProviders);

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("failed");
  });

  it("should mark notifications with an explicit drop marker as dropped", async () => {
    const droppingProvider = new FakeNotificationProvider("fake", {
      kind: "drop",
    });
    dal.notificationProviders.set("fake", droppingProvider);

    const [nid] = await notificationService.queue(sampleNotification);

    await notificationHandler(notificationService, dal.notificationProviders);

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("dropped");
  });

  it("should run ok with no notifications queued", async () => {
    await expect(
      notificationHandler(notificationService, dal.notificationProviders)
    ).resolves.not.toThrow();
  });

  it("should only send once", async () => {
    provider.sendResult = true;
    await notificationService.queue(sampleNotification);

    for (let i = 0; i < 3; i++) {
      await notificationHandler(notificationService, dal.notificationProviders);
    }

    const notifications = await notificationService.pollNewNotifications();
    expect(notifications.length).toBe(0);
  });

  it("should still poll when zero providers are registered", async () => {
    dal.notificationProviders.clear();

    const spy = jest.spyOn(notificationService, "pollNewNotifications");
    await notificationHandler(notificationService, dal.notificationProviders);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should drop a row whose type matches no registered provider", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    // Simulate the provider that would have handled this row being removed from
    // config after the row was created.
    dal.notificationProviders.clear();

    await notificationHandler(notificationService, dal.notificationProviders);

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("dropped");
  });

  it("should drop orphaned rows even when the registry is completely empty on a later run", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    dal.notificationProviders.clear();

    // First run: registry is fully empty, but polling still happens and the row
    // resolves to dropped rather than being left in `new` forever.
    await notificationHandler(notificationService, dal.notificationProviders);

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
      notificationHandler(notificationService, dal.notificationProviders)
    ).resolves.not.toThrow();

    const good = await notificationService.getNotification(goodId);
    const bad = await notificationService.getNotification(badId);
    expect(good.status).toBe("sent");
    expect(bad.status).toBe("failed");
  });
});

describe("notificationRetryHandler", () => {
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

    await notificationRetryHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("new");
  });

  it("should retry a failed notification and mark it sent on success", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.updateStatus([nid], "failed");
    provider.sendResult = true;

    await notificationRetryHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("sent");
  });

  it("should leave a notification failed if the retry also fails", async () => {
    const [nid] = await notificationService.queue(sampleNotification);
    await notificationService.updateStatus([nid], "failed");
    provider.sendResult = false;

    await notificationRetryHandler(
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

    await notificationRetryHandler(
      notificationService,
      dal.notificationProviders
    );

    const notification = await notificationService.getNotification(nid);
    expect(notification.status).toBe("dropped");
  });

  it("should run ok with no failed notifications", async () => {
    await expect(
      notificationRetryHandler(notificationService, dal.notificationProviders)
    ).resolves.not.toThrow();
  });
});

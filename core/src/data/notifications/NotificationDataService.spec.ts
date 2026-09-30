import pg from "pg";
import { FakeNotificationProvider } from "../../test-util/FakeNotificationProvider.js";
import { DataAccessLayer } from "../dal.js";
import { createPostgresPool } from "../postgres.js";
import { _deleteAllTheThings } from "../utils.js";
import { NotificationDataService } from "./NotificationDataService.js";

describe("NotificationDataService implementation", () => {
  let dal: DataAccessLayer;
  let data: NotificationDataService;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    dal.notificationProviders.set("fake", new FakeNotificationProvider());
    data = new NotificationDataService(dal);
  });

  beforeEach(async () => {
    await _deleteAllTheThings(dal);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  describe("queue", () => {
    it("should create a new notification", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });

      const fetched = await data.getNotification(nid);

      expect(fetched.status).toBe("new");
      expect(fetched.templateKey).toBe("review-approved");
      expect(fetched.variables.param).toBe("hello");
    });

    it("should create no rows when no providers are registered", async () => {
      dal.notificationProviders.delete("fake");
      try {
        const ids = await data.queue({
          templateKey: "review-approved",
          variables: { param: "hello" },
        });
        expect(ids).toEqual([]);
      } finally {
        dal.notificationProviders.set("fake", new FakeNotificationProvider());
      }
    });

    it("should create one row per registered provider, typed by provider key", async () => {
      dal.notificationProviders.set(
        "second",
        new FakeNotificationProvider("second")
      );
      try {
        const ids = await data.queue({
          templateKey: "review-approved",
          variables: { param: "hello" },
        });
        expect(ids.length).toBe(2);

        const types = await Promise.all(
          ids.map(async (id) => (await data.getNotification(id)).type)
        );
        expect(types.sort()).toEqual(["fake", "second"]);
      } finally {
        dal.notificationProviders.delete("second");
      }
    });

    it("should not retroactively create rows for a provider registered after the event was queued", async () => {
      const [firstId] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });

      dal.notificationProviders.set(
        "late",
        new FakeNotificationProvider("late")
      );
      try {
        const first = await data.getNotification(firstId);
        expect(first.type).toBe("fake");

        const laterIds = await data.queue({
          templateKey: "review-approved",
          variables: { param: "hello again" },
        });
        const laterTypes = await Promise.all(
          laterIds.map(async (id) => (await data.getNotification(id)).type)
        );
        expect(laterTypes.sort()).toEqual(["fake", "late"]);
      } finally {
        dal.notificationProviders.delete("late");
      }
    });
  });

  describe("pollNewNotifications", () => {
    it("should update status to pending", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });

      const notifications = await data.pollNewNotifications();
      expect(notifications[0].id).toBe(nid);

      const fetched = await data.getNotification(nid);
      expect(fetched.status).toBe("pending");
    });
  });

  describe("pollFailedNotifications", () => {
    it("should claim failed rows and move them to pending", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });
      await data.updateStatus([nid], "failed");

      const notifications = await data.pollFailedNotifications();
      expect(notifications.map((n) => n.id)).toContain(nid);

      const fetched = await data.getNotification(nid);
      expect(fetched.status).toBe("pending");
    });

    it("should not claim rows that are not failed", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });

      const notifications = await data.pollFailedNotifications();
      expect(notifications.map((n) => n.id)).not.toContain(nid);
    });

    it("should not claim failed rows that already have a provider ref", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });
      await data.updateStatus([nid], "failed");
      await data.persistProviderRef(nid, "req-1");

      const notifications = await data.pollFailedNotifications();
      expect(notifications.map((n) => n.id)).not.toContain(nid);

      const fetched = await data.getNotification(nid);
      expect(fetched.status).toBe("failed");
      expect(fetched.providerRef).toBe("req-1");
    });
  });

  describe("updateStatus", () => {
    it("should update status", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });

      const result = await data.updateStatus([nid], "sent");
      expect(result).toBe(true);

      const fetched = await data.getNotification(nid);
      expect(fetched.status).toBe("sent");
      expect(fetched.templateKey).toBe("review-approved");
      expect(fetched.variables.param).toBe("hello");
    });

    it("should update status to dropped", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });

      const result = await data.updateStatus([nid], "dropped");
      expect(result).toBe(true);

      const fetched = await data.getNotification(nid);
      expect(fetched.status).toBe("dropped");
    });
  });

  describe("countFailures", () => {
    it("should return if there are failed notifications", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });

      await data.updateStatus([nid], "failed");

      expect(await data.countFailures()).toBe(1);
    });

    it("should return 0 if no failed notifications", async () => {
      expect(await data.countFailures()).toBe(0);
    });
  });

  describe("countStalled", () => {
    it("should return if there are pending notifications", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });

      await data.updateStatus([nid], "pending");

      expect(await data.countStalled()).toBe(1);
    });

    it("should return 0 if no pending notifications", async () => {
      expect(await data.countStalled()).toBe(0);
    });
  });

  describe("deleteOlderThan", () => {
    it("should delete rows older than the cutoff regardless of status", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });
      await data.updateStatus([nid], "dropped");

      const future = new Date(Date.now() + 1000 * 60 * 60 * 24);
      const deleted = await data.deleteOlderThan(future);
      expect(deleted).toBe(1);
    });

    it("should not delete rows newer than the cutoff", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });

      const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
      const deleted = await data.deleteOlderThan(past);
      expect(deleted).toBe(0);

      const fetched = await data.getNotification(nid);
      expect(fetched.id).toBe(nid);
    });
  });

  describe("provider ref and pending confirmation", () => {
    async function age(id: number) {
      await dal.pool.query(
        `UPDATE notifications
         SET updated_at = current_timestamp - interval '5 minutes'
         WHERE id = $1`,
        [id]
      );
    }

    it("persists a provider ref while leaving status pending", async () => {
      const [nid] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });
      await data.pollNewNotifications();

      const stored = await data.persistProviderRef(nid, "req-1");
      expect(stored).toBe(true);

      const fetched = await data.getNotification(nid);
      expect(fetched.status).toBe("pending");
      expect(fetched.providerRef).toBe("req-1");
      expect(fetched.confirmationAttempts).toBe(0);
    });

    it("polls stale pending rows and skips rows inside the lease", async () => {
      const [staleId] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });
      const [freshId] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello again" },
      });
      await data.pollNewNotifications();
      await age(staleId);

      const stale = await data.pollStalePendingNotifications(60 * 1000);
      expect(stale.map((n) => n.id)).toEqual([staleId]);

      const fresh = await data.getNotification(freshId);
      expect(fresh.status).toBe("pending");
    });

    it("reclaims a null-ref pending row as new and leaves a row with a ref", async () => {
      const [nullRefId] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello" },
      });
      const [withRefId] = await data.queue({
        templateKey: "review-approved",
        variables: { param: "hello again" },
      });
      await data.pollNewNotifications();
      await data.persistProviderRef(withRefId, "req-1");

      await data.reclaimPendingAsNew([nullRefId, withRefId]);

      const reclaimed = await data.getNotification(nullRefId);
      const kept = await data.getNotification(withRefId);
      expect(reclaimed.status).toBe("new");
      expect(reclaimed.providerRef).toBeUndefined();
      expect(kept.status).toBe("pending");
      expect(kept.providerRef).toBe("req-1");
    });
  });
});

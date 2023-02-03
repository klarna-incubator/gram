import { Pool } from "pg";
import { PlaintextHandlebarsNotificationTemplate } from "../../notifications/NotificationTemplate";
import { DataAccessLayer } from "../dal";
import { createPostgresPool } from "../postgres";
import { _deleteAllTheThings } from "../utils";
import { NotificationDataService } from "./NotificationDataService";

const sampleNotification = new PlaintextHandlebarsNotificationTemplate(
  "review-approved",
  "Subject {param}",
  "Body {param}",
  async (dal, { param }) => {
    return {
      cc: [
        {
          name: "nopename",
          email: "nopemail",
        },
      ],
      recipients: [
        {
          name: "nopename",
          email: "nopemail",
        },
      ],
      param,
    };
  }
);

describe("NotificationDataService implementation", () => {
  let pool: Pool;
  let dal: DataAccessLayer;
  let data: NotificationDataService;

  beforeAll(async () => {
    pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    dal.templateHandler.register(sampleNotification);
    data = new NotificationDataService(pool, dal);
  });

  beforeEach(async () => {
    await _deleteAllTheThings(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("queue", () => {
    it("should create a new notification", async () => {
      const nid = await data.queue({
        templateKey: "review-approved",
        params: { param: "hello" },
      });

      const fetched = await data.getNotification(nid);

      expect(fetched.status).toBe("new");
      expect(fetched.templateKey).toBe("review-approved");
      expect(fetched.variables.param).toBe("hello");
    });
  });

  describe("pollNewNotifications", () => {
    it("should update status to pending", async () => {
      const nid = await data.queue({
        templateKey: "review-approved",
        params: { param: "hello" },
      });

      const notifications = await data.pollNewNotifications();
      expect(notifications[0].id).toBe(nid);

      const fetched = await data.getNotification(nid);
      expect(fetched.status).toBe("pending");
    });
  });

  describe("updateStatus", () => {
    it("should update status", async () => {
      const nid = await data.queue({
        templateKey: "review-approved",
        params: { param: "hello" },
      });

      const result = await data.updateStatus([nid], "sent");
      expect(result).toBe(true);

      const fetched = await data.getNotification(nid);
      expect(fetched.status).toBe("sent");
      expect(fetched.templateKey).toBe("review-approved");
      expect(fetched.variables.param).toBe("hello");
    });
  });

  describe("countFailures", () => {
    it("should return if there are failed notifications", async () => {
      const nid = await data.queue({
        templateKey: "review-approved",
        params: { param: "hello" },
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
      const nid = await data.queue({
        templateKey: "review-approved",
        params: { param: "hello" },
      });

      await data.updateStatus([nid], "pending");

      expect(await data.countStalled()).toBe(1);
    });

    it("should return 0 if no pending notifications", async () => {
      expect(await data.countStalled()).toBe(0);
    });
  });
});

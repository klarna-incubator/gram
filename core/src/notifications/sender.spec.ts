import { jest } from "@jest/globals";
import { DataAccessLayer } from "../data/dal.js";
import { NotificationDataService } from "../data/notifications/NotificationDataService.js";
import { NotificationInput } from "../data/notifications/NotificationInput.js";
import { createPostgresPool } from "../data/postgres.js";
import { PlaintextHandlebarsNotificationTemplate } from "./NotificationTemplate.js";
import { notificationSender } from "./sender.js";
import { TemplateHandler } from "./TemplateHandler.js";
import { Mock } from "jest-mock";

const mockedSend = jest.fn();

describe("notification sender", () => {
  let notificationService: NotificationDataService;
  let templateHandler: TemplateHandler;
  let dal: DataAccessLayer;

  const sampleNotification: NotificationInput = {
    templateKey: "review-approved",
    params: {},
  };

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    dal.templateHandler.register(
      new PlaintextHandlebarsNotificationTemplate(
        "review-approved",
        "Subject {name}",
        "Body {name}",
        async () => ({
          cc: [{ email: "nopemail", name: "nopename" }],
          recipients: [{ email: "nopemail", name: "nopename" }],
          name: "hello",
        })
      )
    );
    notificationService = new NotificationDataService(dal);
  });

  beforeEach(async () => {
    await notificationService._truncate();
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  describe("notificationSender", () => {
    it("should mark notifications as sent", async () => {
      (mockedSend as Mock).mockImplementation(async () => true);

      const nid = await notificationService.queue(sampleNotification);
      await notificationSender(
        notificationService,
        templateHandler,
        mockedSend
      );

      const notification = await notificationService.getNotification(nid);
      expect(notification.status).toBe("sent");
    });

    it("should mark notifications that returned false as failed", async () => {
      (mockedSend as Mock).mockImplementation(async () => false);

      const nid = await notificationService.queue(sampleNotification);
      await notificationSender(
        notificationService,
        templateHandler,
        mockedSend
      );

      const notification = await notificationService.getNotification(nid);
      expect(notification.status).toBe("failed");
    });

    it("should mark notifications that errored as failed", async () => {
      (mockedSend as Mock).mockImplementation(async () => {
        throw new Error("kaboom");
      });

      const nid = await notificationService.queue(sampleNotification);
      await notificationSender(
        notificationService,
        templateHandler,
        mockedSend
      );

      const notification = await notificationService.getNotification(nid);
      expect(notification.status).toBe("failed");
    });

    it("should run ok with no notifications queued", async () => {
      const mockFn = (mockedSend as Mock).mockImplementation(async () => true);
      await notificationSender(
        notificationService,
        templateHandler,
        mockedSend
      );
      expect(mockFn.mock.calls.length).toBe(0);
    });

    it("should only send once", async () => {
      const mockFn = (mockedSend as Mock).mockImplementation(async () => true);

      await notificationService.queue(sampleNotification);

      for (let i = 0; i < 3; i++) {
        await notificationSender(
          notificationService,
          templateHandler,
          mockedSend
        );
      }

      expect(mockFn.mock.calls.length).toBe(1);
    });
  });

  afterEach(() => {
    notificationService._truncate();
    (mockedSend as Mock).mockReset();
  });

  afterAll(() => {
    (mockedSend as Mock).mockRestore();
  });
});

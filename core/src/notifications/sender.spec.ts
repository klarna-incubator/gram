import { DataAccessLayer } from "../data/dal";
import { NotificationDataService } from "../data/notifications/NotificationDataService";
import { NotificationInput } from "../data/notifications/NotificationInput";
import { createPostgresPool } from "../data/postgres";
import { send } from "./email";
import { PlaintextHandlebarsNotificationTemplate } from "./NotificationTemplate";
import { notificationSender } from "./sender";
import { TemplateHandler } from "./TemplateHandler";

jest.mock("./email");
const mockedSend = jest.mocked(send);

describe("notification sender", () => {
  let notificationService: NotificationDataService;
  let templateHandler: TemplateHandler;
  let pool: any;
  let dal: DataAccessLayer;

  const sampleNotification: NotificationInput = {
    templateKey: "review-approved",
    params: {},
  };

  beforeAll(async () => {
    pool = await createPostgresPool();
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
    notificationService = new NotificationDataService(pool, dal);
  });

  describe("notificationSender", () => {
    it("should mark notifications as sent", async () => {
      mockedSend.mockImplementation(async () => true);

      const nid = await notificationService.queue(sampleNotification);
      await notificationSender(notificationService, templateHandler);

      const notification = await notificationService.getNotification(nid);
      expect(notification.status).toBe("sent");
    });

    it("should mark notifications that returned false as failed", async () => {
      mockedSend.mockImplementation(async () => false);

      const nid = await notificationService.queue(sampleNotification);
      await notificationSender(notificationService, templateHandler);

      const notification = await notificationService.getNotification(nid);
      expect(notification.status).toBe("failed");
    });

    it("should mark notifications that errored as failed", async () => {
      mockedSend.mockImplementation(async () => {
        throw new Error("kaboom");
      });

      const nid = await notificationService.queue(sampleNotification);
      await notificationSender(notificationService, templateHandler);

      const notification = await notificationService.getNotification(nid);
      expect(notification.status).toBe("failed");
    });

    it("should run ok with no notifications queued", async () => {
      const mockFn = mockedSend.mockImplementation(async () => true);
      await notificationSender(notificationService, templateHandler);
      expect(mockFn.mock.calls.length).toBe(0);
    });

    it("should only send once", async () => {
      const mockFn = mockedSend.mockImplementation(async () => true);

      await notificationService.queue(sampleNotification);
      await notificationSender(notificationService, templateHandler);
      await notificationSender(notificationService, templateHandler);
      await notificationSender(notificationService, templateHandler);

      expect(mockFn.mock.calls.length).toBe(1);
    });
  });

  afterEach(() => {
    notificationService._truncate();
    mockedSend.mockReset();
  });

  afterAll(() => {
    mockedSend.mockRestore();
  });
});

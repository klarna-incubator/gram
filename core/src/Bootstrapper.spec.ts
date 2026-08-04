import { DataAccessLayer } from "./data/dal.js";
import { createPostgresPool } from "./data/postgres.js";
import { Bootstrapper } from "./Bootstrapper.js";
import { FakeNotificationProvider } from "./test-util/FakeNotificationProvider.js";

describe("Bootstrapper", () => {
  let dal: DataAccessLayer;
  let bt: Bootstrapper;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    bt = new Bootstrapper(dal);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  describe("registerNotificationProviders", () => {
    it("registers providers by key", () => {
      bt.registerNotificationProviders([new FakeNotificationProvider("one")]);
      expect(dal.notificationProviders.has("one")).toBe(true);
    });

    it("throws when two providers share the same key", () => {
      expect(() =>
        bt.registerNotificationProviders([
          new FakeNotificationProvider("dup"),
          new FakeNotificationProvider("dup"),
        ])
      ).toThrow(/Duplicate NotificationProvider key/);
    });
  });
});

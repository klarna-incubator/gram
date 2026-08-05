import { FakeNotificationProvider } from "../test-util/FakeNotificationProvider.js";

describe("NotificationProvider", () => {
  describe("handle", () => {
    it("resolves to sent when the transport succeeds", async () => {
      const provider = new FakeNotificationProvider("fake");
      provider.sendResult = true;

      const outcome = await provider.handle("review-approved", {}, 1);
      expect(outcome).toBe("sent");
    });

    it("resolves to failed when the transport returns false", async () => {
      const provider = new FakeNotificationProvider("fake");
      provider.sendResult = false;

      const outcome = await provider.handle("review-approved", {}, 1);
      expect(outcome).toBe("failed");
    });

    it("resolves to failed when the transport throws", async () => {
      const provider = new FakeNotificationProvider("fake");
      provider.sendImpl = async () => {
        throw new Error("kaboom");
      };

      const outcome = await provider.handle("review-approved", {}, 1);
      expect(outcome).toBe("failed");
    });

    it("resolves to dropped when the render method returns an explicit drop marker", async () => {
      const provider = new FakeNotificationProvider("fake", { kind: "drop" });

      const outcome = await provider.handle("review-approved", {}, 1);
      expect(outcome).toBe("dropped");
    });

    it("resolves to failed when there is no entry at all for the key", async () => {
      const provider = new FakeNotificationProvider("fake");

      const outcome = await provider.handle("some-plugin-key", {}, 1);
      expect(outcome).toBe("failed");
    });

    it("resolves to failed, and does not throw, when render() itself throws", async () => {
      const provider = new FakeNotificationProvider("fake");
      provider.renderError = new Error('"name" not defined in [object Object]');

      await expect(provider.handle("review-approved", {}, 1)).resolves.toBe(
        "failed"
      );
    });
  });
});

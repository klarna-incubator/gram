import { FakeNotificationProvider } from "../test-util/FakeNotificationProvider.js";

describe("NotificationProvider", () => {
  describe("handle", () => {
    it("resolves to sent when the transport succeeds", async () => {
      const provider = new FakeNotificationProvider("fake");
      provider.sendResult = { outcome: "sent" };

      const outcome = await provider.handle("review-approved", {}, 1);
      expect(outcome).toEqual({ outcome: "sent" });
    });

    it("resolves to failed when the transport returns failed", async () => {
      const provider = new FakeNotificationProvider("fake");
      provider.sendResult = { outcome: "failed" };

      const outcome = await provider.handle("review-approved", {}, 1);
      expect(outcome).toEqual({ outcome: "failed" });
    });

    it("resolves to failed when the transport throws", async () => {
      const provider = new FakeNotificationProvider("fake");
      provider.sendImpl = async () => {
        throw new Error("kaboom");
      };

      const outcome = await provider.handle("review-approved", {}, 1);
      expect(outcome).toEqual({ outcome: "failed" });
    });

    it("resolves to dropped when the render method returns an explicit drop marker", async () => {
      const provider = new FakeNotificationProvider("fake", { kind: "drop" });

      const outcome = await provider.handle("review-approved", {}, 1);
      expect(outcome).toEqual({ outcome: "dropped" });
    });

    it("resolves to failed when there is no entry at all for the key", async () => {
      const provider = new FakeNotificationProvider("fake");

      const outcome = await provider.handle("some-plugin-key", {}, 1);
      expect(outcome).toEqual({ outcome: "failed" });
    });

    it("resolves to failed, and does not throw, when render() itself throws", async () => {
      const provider = new FakeNotificationProvider("fake");
      provider.renderError = new Error('"name" not defined in [object Object]');

      await expect(provider.handle("review-approved", {}, 1)).resolves.toEqual({
        outcome: "failed",
      });
    });

    it("returns awaiting-confirmation plus the provider ref from send()", async () => {
      const provider = new FakeNotificationProvider("fake");
      provider.sendResult = {
        outcome: "awaiting-confirmation",
        ref: "req-1",
      };

      const outcome = await provider.handle("review-approved", {}, 1);
      expect(outcome).toEqual({
        outcome: "awaiting-confirmation",
        ref: "req-1",
      });
    });

    it("does not implement checkStatus unless a provider defines it", () => {
      const provider = new FakeNotificationProvider("fake");
      expect(provider.checkStatus).toBeUndefined();
    });
  });
});

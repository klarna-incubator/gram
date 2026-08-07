import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { KepNotifierNotificationProvider } from "./KepNotifierNotificationProvider.js";

function fakeDal(
  teamsByUser: Record<string, { id: string; name: string }[]> = {}
) {
  return {
    teamHandler: {
      async getTeamsForUser(ctx: unknown, userId: string) {
        return teamsByUser[userId] || [];
      },
    },
  } as any;
}

type MockResponse = { status: number; body: unknown };

function createFakeKepNotifierServer() {
  let notifyTeamResponse: MockResponse = {
    status: 200,
    body: { request_id: "team-req-id" },
  };
  let notifySystemResponse: MockResponse = {
    status: 200,
    body: { request_id: "system-req-id" },
  };
  let statusResponses: MockResponse[] = [
    { status: 200, body: { request_id: "unknown", state: "DELIVERED" } },
  ];
  let statusCallCount = 0;
  let lastNotifyTeamBody: any;
  let lastNotifySystemBody: any;

  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const url = req.url || "";

      if (req.method === "POST" && url === "/s2s/v3/notify-team") {
        lastNotifyTeamBody = raw ? JSON.parse(raw) : undefined;
        res.statusCode = notifyTeamResponse.status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(notifyTeamResponse.body));
        return;
      }

      if (req.method === "POST" && url === "/s2s/v2/notify-system") {
        lastNotifySystemBody = raw ? JSON.parse(raw) : undefined;
        res.statusCode = notifySystemResponse.status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(notifySystemResponse.body));
        return;
      }

      if (req.method === "GET" && url.startsWith("/s2s/v2/notification/")) {
        const idx = Math.min(statusCallCount, statusResponses.length - 1);
        const resp = statusResponses[idx];
        statusCallCount++;
        res.statusCode = resp.status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(resp.body));
        return;
      }

      res.statusCode = 404;
      res.end();
    });
  });

  return {
    server,
    setNotifyTeamResponse: (r: MockResponse) => (notifyTeamResponse = r),
    setNotifySystemResponse: (r: MockResponse) => (notifySystemResponse = r),
    setStatusResponses: (rs: MockResponse[]) => {
      statusResponses = rs;
      statusCallCount = 0;
    },
    getLastNotifyTeamBody: () => lastNotifyTeamBody,
    getLastNotifySystemBody: () => lastNotifySystemBody,
    getStatusCallCount: () => statusCallCount,
    reset: () => {
      notifyTeamResponse = { status: 200, body: { request_id: "team-req-id" } };
      notifySystemResponse = {
        status: 200,
        body: { request_id: "system-req-id" },
      };
      statusResponses = [
        { status: 200, body: { request_id: "unknown", state: "DELIVERED" } },
      ];
      statusCallCount = 0;
      lastNotifyTeamBody = undefined;
      lastNotifySystemBody = undefined;
    },
  };
}

describe("KepNotifierNotificationProvider", () => {
  describe("render", () => {
    const provider = new KepNotifierNotificationProvider(fakeDal());

    it("drops an out-of-scope key even when the model has a system", () => {
      const result = provider.render("review-declined", {
        requester: { email: "a@b.com" },
        system: { id: "sys-1", name: "System One" },
        model: { name: "v1", link: "http://x/model/1" },
      });
      expect(result).toEqual({ kind: "drop" });
    });

    it("drops an out-of-scope key when the model has no system", () => {
      const result = provider.render("review-reviewer-changed", {
        requester: { email: "a@b.com" },
        system: null,
        model: { name: "v1", link: "http://x/model/1" },
      });
      expect(result).toEqual({ kind: "drop" });
    });

    it("builds a real template for review-canceled on a system-owned model", () => {
      const result: any = provider.render("review-canceled", {
        requester: { email: "a@b.com" },
        system: { id: "sys-1", name: "System One" },
        model: { name: "v1", link: "http://x/model/1" },
      });
      expect(result.system_id).toBe("sys-1");
      expect(result.title).toContain("canceled");
      expect(result.actions).toContainEqual({
        title: "View in Gram",
        url: "http://x/model/1",
      });
    });

    it("builds a NotifySystemTemplate synchronously when the model has a system", () => {
      const result: any = provider.render("review-approved", {
        requester: { email: "a@b.com" },
        reviewer: { name: "Reviewer Name" },
        system: { id: "sys-1", name: "System One" },
        model: { name: "v1", link: "http://x/model/1" },
      });

      expect(result.system_id).toBe("sys-1");
      expect(result.title).toContain("approved");
      expect(result.team_acc).toBeUndefined();
      // Every in-scope template links back to Gram so there's always a way
      // to act on what the message says.
      expect(result.actions).toContainEqual({
        title: "View in Gram",
        url: "http://x/model/1",
      });
    });

    it("builds an ActionableNotification when the in-scope template defines actions", () => {
      const result: any = provider.render("review-requested", {
        requester: { name: "Requester Name", email: "a@b.com" },
        system: { id: "sys-1", name: "System One" },
        model: { name: "v1", link: "http://x/model/1" },
      });

      expect(result.system_id).toBe("sys-1");
      expect(result.actions).toEqual([
        { title: "View in Gram", url: "http://x/model/1" },
      ]);
    });

    it("builds a NotifyTeamTemplate carrying the requester when the model has no system", () => {
      const result: any = provider.render("review-requested", {
        requester: { name: "Requester Name", email: "a@b.com" },
        system: null,
        model: { name: "v1", link: "http://x/model/1" },
      });

      expect(result.system_id).toBeUndefined();
      expect(result.team_acc).toBe("");
      expect(result.requester).toEqual({
        name: "Requester Name",
        email: "a@b.com",
      });
    });

    it("uses the standalone-model content for any in-scope key when there is no system", () => {
      const resultApproved: any = provider.render("review-approved", {
        requester: { email: "a@b.com" },
        system: null,
        model: { name: "v1", link: "http://x/model/1" },
      });
      const resultRequested: any = provider.render("review-requested", {
        requester: { email: "a@b.com" },
        system: null,
        model: { name: "v1", link: "http://x/model/1" },
      });

      expect(resultApproved.title).toBe(resultRequested.title);
      expect(resultApproved.message).toBe(resultRequested.message);
    });

    it("drops rather than throws on malformed variables", () => {
      const result = provider.render("review-requested", null as any);
      expect(result).toEqual({ kind: "drop" });
    });
  });

  describe("send", () => {
    let fakeServer: ReturnType<typeof createFakeKepNotifierServer>;
    let server: Server;
    let baseUrl: string;
    const originalUrl = process.env.KEP_NOTIFIER_URL;

    beforeAll(async () => {
      fakeServer = createFakeKepNotifierServer();
      server = fakeServer.server;
      await new Promise<void>((resolve) => server.listen(0, () => resolve()));
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      process.env.KEP_NOTIFIER_URL = baseUrl;
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      process.env.KEP_NOTIFIER_URL = originalUrl;
    });

    afterEach(() => {
      fakeServer.reset();
    });

    it("posts to notify-system and reports sent once status reaches DELIVERED", async () => {
      fakeServer.setStatusResponses([
        {
          status: 200,
          body: { request_id: "system-req-id", state: "SENDING" },
        },
        {
          status: 200,
          body: { request_id: "system-req-id", state: "DELIVERED" },
        },
      ]);
      const provider = new KepNotifierNotificationProvider(fakeDal());
      const template = provider.render("review-requested", {
        requester: { name: "Requester", email: "a@b.com" },
        system: { id: "sys-1", name: "System One" },
        model: { name: "v1", link: "http://x/model/1" },
      }) as any;

      const result = await (provider as any).send(template);

      expect(result).toBe(true);
      expect(fakeServer.getLastNotifySystemBody()).toMatchObject({
        system_id: "sys-1",
      });
    }, 10000);

    it("resolves team_acc via dal.teamHandler and strips requester from the wire body", async () => {
      const provider = new KepNotifierNotificationProvider(
        fakeDal({ "a@b.com": [{ id: "200031", name: "Secure Development" }] })
      );
      const template = provider.render("review-requested", {
        requester: { name: "Requester", email: "a@b.com" },
        system: null,
        model: { name: "v1", link: "http://x/model/1" },
      }) as any;

      const result = await (provider as any).send(template);

      expect(result).toBe(true);
      const body = fakeServer.getLastNotifyTeamBody();
      expect(body.team_acc).toBe("200031");
      expect(body.requester).toBeUndefined();
    });

    it("returns false without issuing any HTTP request when the requester has no team", async () => {
      const provider = new KepNotifierNotificationProvider(fakeDal({}));
      const template = provider.render("review-requested", {
        requester: { name: "Requester", email: "nobody@b.com" },
        system: null,
        model: { name: "v1", link: "http://x/model/1" },
      }) as any;

      const result = await (provider as any).send(template);

      expect(result).toBe(false);
      expect(fakeServer.getLastNotifyTeamBody()).toBeUndefined();
    });

    it("stops retrying immediately on a non-SENDING, non-DELIVERED state", async () => {
      fakeServer.setStatusResponses([
        { status: 200, body: { request_id: "system-req-id", state: "FAILED" } },
        {
          status: 200,
          body: { request_id: "system-req-id", state: "DELIVERED" },
        },
      ]);
      const provider = new KepNotifierNotificationProvider(fakeDal());
      const template = provider.render("review-approved", {
        requester: { email: "a@b.com" },
        system: { id: "sys-1", name: "System One" },
        model: { name: "v1", link: "http://x/model/1" },
      }) as any;

      const result = await (provider as any).send(template);

      expect(result).toBe(false);
      expect(fakeServer.getStatusCallCount()).toBe(1);
    });

    it("gives up after the max number of attempts if the notification never leaves SENDING", async () => {
      fakeServer.setStatusResponses([
        {
          status: 200,
          body: { request_id: "system-req-id", state: "SENDING" },
        },
      ]);
      const provider = new KepNotifierNotificationProvider(fakeDal());
      const template = provider.render("review-approved", {
        requester: { email: "a@b.com" },
        system: { id: "sys-1", name: "System One" },
        model: { name: "v1", link: "http://x/model/1" },
      }) as any;

      const result = await (provider as any).send(template);

      expect(result).toBe(false);
      expect(fakeServer.getStatusCallCount()).toBe(5);
    }, 10000);

    it("returns false when the initial notify-system POST fails", async () => {
      fakeServer.setNotifySystemResponse({
        status: 400,
        body: { error: "bad request" },
      });
      const provider = new KepNotifierNotificationProvider(fakeDal());
      const template = provider.render("review-approved", {
        requester: { email: "a@b.com" },
        system: { id: "sys-1", name: "System One" },
        model: { name: "v1", link: "http://x/model/1" },
      }) as any;

      const result = await (provider as any).send(template);

      expect(result).toBe(false);
      expect(fakeServer.getStatusCallCount()).toBe(0);
    });

    it("throws for a template with neither team_acc nor system_id", async () => {
      const provider = new KepNotifierNotificationProvider(fakeDal());

      await expect(
        (provider as any).send({ sinks: ["slack"] })
      ).rejects.toThrow("Invalid template");
    });
  });
});

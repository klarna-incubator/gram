import { jest } from "@jest/globals";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { config } from "@gram/core/dist/config/index.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { genUser } from "@gram/core/dist/test-util/authz.js";
import http from "http";
import WebSocket from "ws";
import { createApp } from "../app.js";
import { createTestApp } from "../test-util/app.js";
import { sampleOwnedSystem } from "../test-util/sampleOwnedSystem.js";
import { attachRealtime } from "./index.js";
import { _permissionsInterface } from "./permissions.js";
import { roomRegistry } from "./rooms.js";
import {
  attachSseRealtime,
  defaultSseSettings,
  getSseSettings,
} from "./sse.js";

const PORT = 8124;
const BASE = `http://localhost:${PORT}/api/v1/models`;
const MODEL_ID = "ae269267-d025-49ba-9f5b-126e938e4c89";
const MISSING_MODEL_ID = "00000000-0000-0000-0000-000000000000";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type SseEvent = {
  event?: string;
  data?: any;
  comment?: string;
  ended?: boolean;
};

class SseClient {
  status = 0;
  headers!: http.IncomingHttpHeaders;
  events: SseEvent[] = [];
  controller = new AbortController();
  private buffer = "";
  private listeners: (() => void)[] = [];

  get connectionId(): string {
    return this.events.find((e) => e.event === "connected")?.data.connectionId;
  }

  push(text: string, ended = false) {
    if (ended) this.events.push({ ended: true });
    this.buffer += text;
    const blocks = this.buffer.split("\n\n");
    this.buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      if (block.startsWith(":")) {
        this.events.push({ comment: block.substring(1).trim() });
        continue;
      }
      const event: SseEvent = {};
      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) event.event = line.substring(7);
        if (line.startsWith("data: "))
          event.data = JSON.parse(line.substring(6));
      }
      this.events.push(event);
    }
    this.listeners.forEach((listener) => listener());
  }

  async waitFor(predicate: (e: SseEvent) => boolean, timeout = 1000) {
    const find = () => this.events.find(predicate);
    if (find()) return find()!;
    return new Promise<SseEvent>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("timed out waiting for event")),
        timeout
      );
      const listener = () => {
        const found = find();
        if (found) {
          clearTimeout(timer);
          this.listeners = this.listeners.filter((l) => l !== listener);
          resolve(found);
        }
      };
      this.listeners.push(listener);
    });
  }

  waitForUsers(count: number) {
    return this.waitFor(
      (e) =>
        e.data?.type === "realtime/activeUsers" &&
        e.data.payload.users.length === count
    );
  }

  abort() {
    this.controller.abort();
  }
}

// The Jest environment may not expose a global fetch (older jest-environment-node
// versions don't), so requests go through node's http module.
type HttpResponse = {
  status: number;
  headers: http.IncomingHttpHeaders;
  stream: http.IncomingMessage;
};

function request(
  url: string,
  options: {
    method?: string;
    headers?: http.OutgoingHttpHeaders;
    body?: string;
    signal?: AbortSignal;
  } = {}
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method ?? "GET",
        headers: options.headers,
        signal: options.signal,
      },
      (res) =>
        resolve({ status: res.statusCode!, headers: res.headers, stream: res })
    );
    req.on("error", reject);
    req.end(options.body);
  });
}

function drain(response: HttpResponse): Promise<void> {
  return new Promise((resolve) => {
    response.stream.on("end", resolve).on("error", resolve).resume();
  });
}

async function authHeaders(sub: string | null) {
  if (!sub) return {};
  const token = await jwt.generateToken(genUser({ sub }));
  return { authorization: `bearer ${token}` };
}

async function openStream(sub: string | null, modelId = MODEL_ID) {
  const client = new SseClient();
  const response = await request(`${BASE}/${modelId}/events`, {
    headers: await authHeaders(sub),
    signal: client.controller.signal,
  });
  client.status = response.status;
  client.headers = response.headers;

  if (response.status === 200) {
    response.stream.setEncoding("utf8");
    response.stream
      .on("data", (chunk: string) => client.push(chunk))
      .on("end", () => client.push("", true))
      .on("error", () => {
        // Aborted by the test.
      });
  } else {
    await drain(response);
  }
  return client;
}

async function postEdit(
  sub: string,
  connectionId: string,
  body: any,
  modelId = MODEL_ID
) {
  return request(`${BASE}/${modelId}/events/${connectionId}`, {
    method: "POST",
    headers: {
      ...(await authHeaders(sub)),
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function heartbeat(sub: string | null, connectionId: string) {
  return request(`${BASE}/${MODEL_ID}/events/${connectionId}/heartbeat`, {
    method: "POST",
    headers: await authHeaders(sub),
  });
}

async function leave(sub: string, connectionId: string, modelId = MODEL_ID) {
  return request(`${BASE}/${modelId}/events/${connectionId}`, {
    method: "DELETE",
    headers: await authHeaders(sub),
  });
}

describe("sse transport", () => {
  let dal: DataAccessLayer;
  let appServer: http.Server;
  let cleanupInterval: NodeJS.Timeout;
  let clients: SseClient[] = [];
  const originalTransport = config.realtimeTransport;
  // Overrides what the config files would set for the SSE settings.
  const configureSse = (sse: Record<string, number>) => {
    config.realtimeTransport = { type: "sse", sse };
  };

  const modelGetById = () => jest.spyOn(dal.modelService, "getById");
  const getPermissions = jest.spyOn(_permissionsInterface, "getPermissions");

  const open = async (sub: string | null, modelId = MODEL_ID) => {
    const client = await openStream(sub, modelId);
    clients.push(client);
    return client;
  };

  beforeAll(async () => {
    config.realtimeTransport = { type: "sse" };
    const testApp = await createTestApp();
    dal = testApp.dal;
    ({ cleanupInterval } = attachSseRealtime(dal));
    appServer = http.createServer(testApp.app as any);
    await new Promise<void>((resolve) => appServer.listen(PORT, resolve));
  });

  afterAll(async () => {
    config.realtimeTransport = originalTransport;
    clearInterval(cleanupInterval);
    await new Promise((resolve) => appServer.close(resolve));
  });

  beforeEach(() => {
    roomRegistry.clear();
    modelGetById().mockImplementation(async (id: string) => {
      if (id === MISSING_MODEL_ID) return null;
      const model = new Model(sampleOwnedSystem.id, "Gram", "root");
      model.id = id;
      model.createdAt = Date.now();
      model.updatedAt = Date.now();
      return model;
    });
    getPermissions.mockImplementation(async (_ctx, _model, user) => {
      if (user.sub.startsWith("noaccess")) return [];
      if (user.sub.startsWith("reader")) return [Permission.Read];
      return [Permission.Read, Permission.Write];
    });
  });

  afterEach(() => {
    clients.forEach((client) => client.abort());
    clients = [];
    config.realtimeTransport = { type: "sse" };
  });

  describe("opening the stream", () => {
    it("responds 401 without credentials", async () => {
      const client = await open(null);
      expect(client.status).toEqual(401);
    });

    it("responds 404 for an unknown model", async () => {
      const client = await open("user@abc.xyz", MISSING_MODEL_ID);
      expect(client.status).toEqual(404);
    });

    it("responds 403 without read permission", async () => {
      const client = await open("noaccess@abc.xyz");
      expect(client.status).toEqual(403);
    });

    it("opens an event stream and sends the connection id first", async () => {
      const client = await open("user@abc.xyz");

      expect(client.status).toEqual(200);
      expect(client.headers["content-type"]).toContain("text/event-stream");
      expect(client.headers["cache-control"]).toEqual("no-cache, no-transform");
      expect(client.headers["x-accel-buffering"]).toEqual("no");

      await client.waitFor((e) => e.event === "connected");
      expect(typeof client.connectionId).toEqual("string");
      expect(client.events[0].event).toEqual("connected");
    });
  });

  describe("connection limit", () => {
    it("closes the user's oldest stream when the limit is exceeded", async () => {
      configureSse({ maxConnectionsPerUser: 2 });
      const first = await open("user@abc.xyz");
      const second = await open("user@abc.xyz");
      await second.waitFor((e) => e.event === "connected");

      const third = await open("user@abc.xyz");
      await third.waitFor((e) => e.event === "connected");

      await first.waitFor((e) => e.ended === true);
      const ids = roomRegistry.get(MODEL_ID)?.connections.map((c) => c.id);
      expect(ids).toEqual([second.connectionId, third.connectionId]);
    });

    it("lets the config override the default", async () => {
      configureSse({ maxConnectionsPerUser: 2 });
      const first = await open("user@abc.xyz");
      const second = await open("user@abc.xyz");
      await second.waitFor((e) => e.event === "connected");

      expect(roomRegistry.get(MODEL_ID)?.connections).toHaveLength(2);
      expect(first.events.some((e) => e.ended)).toBe(false);
    });

    it("does not count other users' streams", async () => {
      configureSse({ maxConnectionsPerUser: 1 });
      const other = await open("other@abc.xyz");
      await other.waitFor((e) => e.event === "connected");

      const user = await open("user@abc.xyz");
      await user.waitFor((e) => e.event === "connected");

      expect(roomRegistry.get(MODEL_ID)?.connections).toHaveLength(2);
      expect(other.events.some((e) => e.ended)).toBe(false);
    });
  });

  describe("presence", () => {
    it("announces new connected users to other clients", async () => {
      const first = await open("first@abc.xyz");
      const second = await open("second@abc.xyz");

      const announced = await first.waitForUsers(2);
      expect(announced.data.payload.users.map((u: any) => u.sub)).toEqual([
        "first@abc.xyz",
        "second@abc.xyz",
      ]);
      await second.waitForUsers(2);
    });

    it("announces the remaining users when a client disconnects", async () => {
      const first = await open("first@abc.xyz");
      const second = await open("second@abc.xyz");
      await first.waitForUsers(2);
      first.events = [];

      second.abort();

      await first.waitForUsers(1);
      expect(roomRegistry.get(MODEL_ID)?.connections).toHaveLength(1);
    });
  });

  describe("settings", () => {
    it("uses the defaults when the config sets none", () => {
      expect(getSseSettings()).toEqual(defaultSseSettings);
    });

    it("lets the config override single settings", () => {
      configureSse({ idleTimeoutMS: 99 });

      expect(getSseSettings()).toEqual({
        ...defaultSseSettings,
        idleTimeoutMS: 99,
      });
    });

    it("does not change the defaults", () => {
      configureSse({ idleTimeoutMS: 99 });
      getSseSettings();

      expect(defaultSseSettings.idleTimeoutMS).toEqual(120000);
    });
  });

  describe("keep-alive", () => {
    it("writes a keep-alive to an idle stream", async () => {
      configureSse({ keepAliveMS: 30 });
      const client = await open("user@abc.xyz");

      await client.waitFor((e) => e.comment === "keepalive");
    });
  });

  describe("heartbeat", () => {
    it("responds 204 for the owner's connection", async () => {
      const client = await open("user@abc.xyz");
      await client.waitFor((e) => e.event === "connected");

      const response = await heartbeat("user@abc.xyz", client.connectionId);

      expect(response.status).toEqual(204);
    });

    it("responds 404 for another user's or an unknown connection", async () => {
      const owner = await open("owner@abc.xyz");
      await owner.waitFor((e) => e.event === "connected");

      expect(
        (await heartbeat("other@abc.xyz", owner.connectionId)).status
      ).toEqual(404);
      expect((await heartbeat("owner@abc.xyz", "unknown")).status).toEqual(404);
    });

    it("responds 401 without credentials", async () => {
      expect((await heartbeat(null, "anything")).status).toEqual(401);
    });

    it("closes a connection that stays silent and tells the others", async () => {
      configureSse({ keepAliveMS: 20, idleTimeoutMS: 150 });
      const silent = await open("silent@abc.xyz");
      const other = await open("other@abc.xyz");
      await other.waitForUsers(2);

      // Keep the other one alive while the silent one is not heard from.
      const beat = setInterval(
        () => heartbeat("other@abc.xyz", other.connectionId),
        30
      );
      try {
        await silent.waitFor((e) => e.ended === true);
        await other.waitForUsers(1);
      } finally {
        clearInterval(beat);
      }
      expect(roomRegistry.get(MODEL_ID)?.connections).toHaveLength(1);
    });

    it("keeps a connection open while heartbeats arrive", async () => {
      configureSse({ keepAliveMS: 20, idleTimeoutMS: 150 });
      const client = await open("user@abc.xyz");
      await client.waitFor((e) => e.event === "connected");

      const beat = setInterval(
        () => heartbeat("user@abc.xyz", client.connectionId),
        30
      );
      await new Promise((resolve) => setTimeout(resolve, 450));
      clearInterval(beat);

      expect(roomRegistry.get(MODEL_ID)?.connections).toHaveLength(1);
      expect(client.events.some((e) => e.ended)).toBe(false);
    });
  });

  describe("submitting edits", () => {
    it("broadcasts a valid edit to the others but not the sender", async () => {
      const sender = await open("sender@abc.xyz");
      const other = await open("other@abc.xyz");
      await sender.waitForUsers(2);
      await other.waitFor((e) => e.event === "connected");

      const response = await postEdit("sender@abc.xyz", sender.connectionId, {
        type: "MOVE_NODES",
        payload: { x: 1 },
      });

      expect(response.status).toEqual(204);
      const received = await other.waitFor(
        (e) => e.data?.type === "MOVE_NODES"
      );
      expect(received.data).toMatchObject({
        type: "MOVE_NODES",
        payload: { x: 1 },
        from: { sub: "sender@abc.xyz" },
      });
      await sleep(100);
      expect(
        sender.events.filter((e) => e.data?.type === "MOVE_NODES")
      ).toHaveLength(0);
    });

    it("keeps the order of edits submitted one after another", async () => {
      const sender = await open("sender@abc.xyz");
      const other = await open("other@abc.xyz");
      await sender.waitForUsers(2);

      for (let n = 0; n < 5; n++) {
        await postEdit("sender@abc.xyz", sender.connectionId, {
          type: "MOVE_NODES",
          payload: { n },
        });
      }

      await other.waitFor((e) => e.data?.payload?.n === 4);
      expect(
        other.events
          .filter((e) => e.data?.type === "MOVE_NODES")
          .map((e) => e.data.payload.n)
      ).toEqual([0, 1, 2, 3, 4]);
    });

    it("rejects an edit from a user without write permission", async () => {
      const reader = await open("reader@abc.xyz");
      const other = await open("other@abc.xyz");
      await reader.waitForUsers(2);

      const response = await postEdit("reader@abc.xyz", reader.connectionId, {
        type: "MOVE_NODES",
      });

      expect(response.status).toEqual(403);
      await sleep(100);
      expect(
        other.events.filter((e) => e.data?.type === "MOVE_NODES")
      ).toHaveLength(0);
    });

    it("rejects an edit with an invalid type", async () => {
      const sender = await open("sender@abc.xyz");
      const other = await open("other@abc.xyz");
      await sender.waitForUsers(2);

      const response = await postEdit("sender@abc.xyz", sender.connectionId, {
        type: "REFETCH_RESOURCE",
      });

      expect(response.status).toEqual(400);
      await sleep(100);
      expect(
        other.events.filter((e) => e.data?.type === "REFETCH_RESOURCE")
      ).toHaveLength(0);
    });

    it("rejects a body that is an array", async () => {
      const sender = await open("sender@abc.xyz");
      await sender.waitFor((e) => e.event === "connected");

      const response = await postEdit("sender@abc.xyz", sender.connectionId, [
        { type: "MOVE_NODES" },
      ]);

      expect(response.status).toEqual(400);
    });

    it("responds 404 for an unknown connection id", async () => {
      const sender = await open("sender@abc.xyz");
      await sender.waitFor((e) => e.event === "connected");

      const response = await postEdit("sender@abc.xyz", "unknown", {
        type: "MOVE_NODES",
      });

      expect(response.status).toEqual(404);
    });

    it("responds 404 for another user's connection id", async () => {
      const owner = await open("owner@abc.xyz");
      const other = await open("other@abc.xyz");
      await owner.waitForUsers(2);

      const response = await postEdit("other@abc.xyz", owner.connectionId, {
        type: "MOVE_NODES",
      });

      expect(response.status).toEqual(404);
      await sleep(100);
      expect(
        other.events.filter((e) => e.data?.type === "MOVE_NODES")
      ).toHaveLength(0);
    });

    it("responds 401 without credentials", async () => {
      const response = await request(`${BASE}/${MODEL_ID}/events/anything`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "MOVE_NODES" }),
      });

      expect(response.status).toEqual(401);
    });
  });

  describe("leaving", () => {
    it("closes the stream and tells the others the user left", async () => {
      const leaver = await open("leaver@abc.xyz");
      const other = await open("other@abc.xyz");
      await other.waitForUsers(2);
      other.events = [];

      const response = await leave("leaver@abc.xyz", leaver.connectionId);

      expect(response.status).toEqual(204);
      await other.waitForUsers(1);
      expect(roomRegistry.get(MODEL_ID)?.connections).toHaveLength(1);
      await leaver.waitFor((e) => e.ended === true);
    });

    it("responds 404 for another user's connection id", async () => {
      const owner = await open("owner@abc.xyz");
      await open("other@abc.xyz");
      await owner.waitForUsers(2);

      const response = await leave("other@abc.xyz", owner.connectionId);

      expect(response.status).toEqual(404);
      expect(roomRegistry.get(MODEL_ID)?.connections).toHaveLength(2);
    });

    it("responds 404 for an unknown connection id", async () => {
      const client = await open("user@abc.xyz");
      await client.waitFor((e) => e.event === "connected");

      const response = await leave("user@abc.xyz", "unknown");

      expect(response.status).toEqual(404);
    });

    it("responds 401 without credentials", async () => {
      const response = await request(`${BASE}/${MODEL_ID}/events/anything`, {
        method: "DELETE",
      });

      expect(response.status).toEqual(401);
    });
  });

  describe("notifications from the services", () => {
    it("tells connected clients to refetch when a threat changes", async () => {
      const client = await open("user@abc.xyz");
      await client.waitFor((e) => e.event === "connected");

      dal.threatService.emit("updated-for", {
        modelId: MODEL_ID,
        componentId: "component-id",
      });

      const received = await client.waitFor(
        (e) => e.data?.type === "REFETCH_RESOURCE"
      );
      expect(received.data).toMatchObject({
        what: "threats",
        args: { modelId: MODEL_ID, componentId: "component-id" },
      });
    });
  });
});

describe("only the selected transport's endpoints exist", () => {
  let dal: DataAccessLayer;
  const originalTransport = config.realtimeTransport;

  beforeAll(async () => {
    ({ dal } = await createTestApp());
  });

  afterEach(() => {
    config.realtimeTransport = originalTransport;
  });

  const listen = (server: http.Server) =>
    new Promise<void>((resolve) => server.listen(PORT + 1, resolve));
  const close = (server: http.Server) =>
    new Promise((resolve) => server.close(resolve));

  it("does not mount the SSE routes when websocket is selected", async () => {
    config.realtimeTransport = { type: "websocket" };
    const server = http.createServer((await createApp(dal)) as any);
    await listen(server);
    try {
      const response = await request(
        `http://localhost:${PORT + 1}/api/v1/models/${MODEL_ID}/events`,
        { headers: await authHeaders("user@abc.xyz") }
      );
      expect(response.status).toEqual(404);

      const post = await request(
        `http://localhost:${PORT + 1}/api/v1/models/${MODEL_ID}/events/x`,
        {
          method: "POST",
          headers: {
            ...(await authHeaders("user@abc.xyz")),
            "content-type": "application/json",
          },
          body: JSON.stringify({ type: "MOVE_NODES" }),
        }
      );
      expect(post.status).toEqual(404);
    } finally {
      await close(server);
    }
  });

  it("does not accept a websocket upgrade when sse is selected", async () => {
    config.realtimeTransport = { type: "sse" };
    const server = http.createServer((await createApp(dal)) as any);
    const { cleanupInterval } = attachRealtime(server, dal);
    await listen(server);
    try {
      const client = new WebSocket(
        `ws://localhost:${PORT + 1}/ws/model/${MODEL_ID}`,
        { headers: { origin: config.origin } }
      );
      const outcome = await new Promise<string>((resolve) => {
        client.on("open", () => resolve("open"));
        client.on("error", () => resolve("error"));
        client.on("unexpected-response", () => resolve("rejected"));
      });
      expect(outcome).not.toEqual("open");
    } finally {
      clearInterval(cleanupInterval);
      await close(server);
    }
  });
});

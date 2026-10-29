import { createSseParser, heartbeatMS } from "./sse";
import {
  dispatched,
  disconnectLoadedMiddlewares,
  dispatchedTypes,
  flush,
  loadMiddleware as load,
  MODEL_ID,
} from "./testHelpers";

describe("sse middleware", () => {
  const loadMiddleware = () => load("./sse", "sseMiddleware");

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    disconnectLoadedMiddlewares();
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.fetch;
  });

  describe("connection", () => {
    let streams;
    let posts;
    let postResponses;
    let deletes;
    let heartbeats;
    let heartbeatResponse;

    // A controllable response body for an event stream.
    function createStream() {
      const pending = [];
      const chunks = [];
      let ended = false;
      const stream = {
        aborted: false,
        push(text) {
          const chunk = new TextEncoder().encode(text);
          const waiting = pending.shift();
          if (waiting) waiting.resolve({ done: false, value: chunk });
          else chunks.push(chunk);
        },
        end() {
          ended = true;
          pending.splice(0).forEach((p) => p.resolve({ done: true }));
        },
        reader: {
          read() {
            if (chunks.length)
              return Promise.resolve({ done: false, value: chunks.shift() });
            if (ended) return Promise.resolve({ done: true });
            return new Promise((resolve) => pending.push({ resolve }));
          },
        },
      };
      return stream;
    }

    const connectedEvent = (id = "connection-1") =>
      `event: connected\ndata: ${JSON.stringify({ connectionId: id })}\n\n`;

    beforeEach(() => {
      streams = [];
      posts = [];
      postResponses = [];
      deletes = [];
      heartbeats = [];
      heartbeatResponse = () => Promise.resolve({ ok: true, status: 204 });
      global.fetch = jest.fn((url, options = {}) => {
        if (options.method === "POST" && url.endsWith("/heartbeat")) {
          heartbeats.push({ url, options });
          return heartbeatResponse();
        }
        if (options.method === "DELETE") {
          deletes.push({ url, options });
          return Promise.resolve({ ok: true, status: 204 });
        }
        if (options.method === "POST") {
          const response = new Promise((resolve) => {
            posts.push({ url, options, resolve });
          });
          postResponses.push(response);
          return response;
        }
        const stream = createStream();
        stream.url = url;
        stream.options = options;
        options.signal?.addEventListener("abort", () => {
          stream.aborted = true;
          stream.end();
        });
        streams.push(stream);
        return Promise.resolve({
          ok: true,
          status: 200,
          body: { getReader: () => stream.reader },
        });
      });
    });

    async function connect() {
      const loaded = loadMiddleware();
      loaded.middleware(loaded.realtimeActions.establishConnection(MODEL_ID));
      await flush();
      streams[0].push(connectedEvent());
      await flush();
      return loaded;
    }

    it("opens the model's event stream with the auth header", async () => {
      const { middleware, realtimeActions } = loadMiddleware();

      middleware(realtimeActions.establishConnection(MODEL_ID));
      await flush();

      expect(streams[0].url).toMatch(
        new RegExp(`/api/v1/models/${MODEL_ID}/events$`)
      );
      expect(streams[0].options.headers.authorization).toEqual(
        "bearer test-token"
      );
      expect(streams[0].options.headers.accept).toEqual("text/event-stream");
    });

    it("is connected once the server announces the connection", async () => {
      const { middleware, realtimeActions, dispatch } = loadMiddleware();
      middleware(realtimeActions.establishConnection(MODEL_ID));
      await flush();
      expect(dispatchedTypes(dispatch)).not.toContain(
        realtimeActions.connectionEstablished.type
      );

      streams[0].push(connectedEvent());
      await flush();

      expect(dispatchedTypes(dispatch)).toContain(
        realtimeActions.connectionEstablished.type
      );
      expect(dispatchedTypes(dispatch)).toContain("api/invalidateTags");
    });

    it("dispatches edits received from others as remote actions", async () => {
      const { dispatch } = await connect();

      streams[0].push(
        `data: ${JSON.stringify({ type: "MOVE_NODES", payload: { x: 1 } })}\n\n`
      );
      await flush();

      expect(dispatched(dispatch)).toContainEqual({
        type: "MOVE_NODES",
        payload: { x: 1 },
        remote: true,
      });
    });

    it("invalidates the cache on a refetch notification", async () => {
      const { dispatch } = await connect();
      dispatch.mockClear();

      streams[0].push(
        `data: ${JSON.stringify({
          type: "REFETCH_RESOURCE",
          what: "controls",
          args: {},
        })}\n\n`
      );
      await flush();

      expect(dispatchedTypes(dispatch)).toEqual(["api/invalidateTags"]);
    });

    it("posts local edits to the connection's endpoint", async () => {
      const { middleware } = await connect();

      middleware({ type: "MOVE_NODES", payload: { x: 2 } });
      await flush();

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toMatch(
        new RegExp(`/api/v1/models/${MODEL_ID}/events/connection-1$`)
      );
      expect(posts[0].options.method).toEqual("POST");
      expect(posts[0].options.headers.authorization).toEqual(
        "bearer test-token"
      );
      expect(JSON.parse(posts[0].options.body)).toEqual({
        type: "MOVE_NODES",
        payload: { x: 2 },
      });
    });

    it("keeps one edit in flight and sends them in order", async () => {
      const { middleware } = await connect();

      middleware({ type: "MOVE_NODES", payload: { n: 1 } });
      middleware({ type: "MOVE_NODES", payload: { n: 2 } });
      middleware({ type: "MOVE_NODES", payload: { n: 3 } });
      await flush();
      expect(posts).toHaveLength(1);

      posts[0].resolve({ ok: true, status: 204 });
      await flush();
      expect(posts).toHaveLength(2);

      posts[1].resolve({ ok: true, status: 204 });
      await flush();
      expect(posts).toHaveLength(3);

      expect(posts.map((p) => JSON.parse(p.options.body).payload.n)).toEqual([
        1, 2, 3,
      ]);
    });

    it("keeps sending after an edit is rejected", async () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});
      const { middleware } = await connect();

      middleware({ type: "MOVE_NODES", payload: { n: 1 } });
      middleware({ type: "MOVE_NODES", payload: { n: 2 } });
      await flush();
      posts[0].resolve({ ok: false, status: 400 });
      await flush();

      expect(posts).toHaveLength(2);
    });

    it("disconnects when the server no longer knows the connection", async () => {
      const { middleware, realtimeActions, dispatch } = await connect();

      middleware({ type: "MOVE_NODES", payload: { n: 1 } });
      middleware({ type: "MOVE_NODES", payload: { n: 2 } });
      await flush();
      posts[0].resolve({ ok: false, status: 404 });
      await flush();

      expect(dispatchedTypes(dispatch)).toContain(
        realtimeActions.disconnect.type
      );
      expect(posts).toHaveLength(1);
    });

    it("does not send edits before the connection id is known", async () => {
      const { middleware, realtimeActions } = loadMiddleware();
      middleware(realtimeActions.establishConnection(MODEL_ID));
      await flush();

      middleware({ type: "MOVE_NODES", payload: { n: 1 } });
      await flush();

      expect(posts).toHaveLength(0);
    });

    it("does not send edits without write access", async () => {
      const { middleware, state } = await connect();
      state.api.queries[`getModelPermissions({"modelId":"${MODEL_ID}"})`] = {
        data: ["read"],
      };

      middleware({ type: "MOVE_NODES", payload: { n: 1 } });
      await flush();

      expect(posts).toHaveLength(0);
    });

    it("stays connected while keep-alives arrive", async () => {
      const { dispatch, realtimeActions } = await connect();

      for (let i = 0; i < 4; i++) {
        jest.advanceTimersByTime(10000);
        streams[0].push(": keepalive\n\n");
        await flush();
      }

      expect(dispatchedTypes(dispatch)).not.toContain(
        realtimeActions.disconnect.type
      );
    });

    it("disconnects when nothing is received for too long", async () => {
      const { dispatch, realtimeActions } = await connect();

      jest.advanceTimersByTime(15001);

      expect(dispatchedTypes(dispatch)).toContain(
        realtimeActions.disconnect.type
      );
    });

    it("disconnects when the server ends the stream", async () => {
      const { dispatch, realtimeActions } = await connect();

      streams[0].end();
      await flush();

      expect(dispatchedTypes(dispatch)).toContain(
        realtimeActions.disconnect.type
      );
    });

    describe("heartbeat", () => {
      it("is sent to the server at a fixed interval once connected", async () => {
        await connect();
        expect(heartbeats).toHaveLength(0);

        jest.advanceTimersByTime(heartbeatMS);
        await flush();
        jest.advanceTimersByTime(heartbeatMS);
        await flush();

        expect(heartbeats).toHaveLength(2);
        expect(heartbeats[0].url).toMatch(
          new RegExp(
            `/api/v1/models/${MODEL_ID}/events/connection-1/heartbeat$`
          )
        );
        expect(heartbeats[0].options.headers.authorization).toEqual(
          "bearer test-token"
        );
      });

      it("is not sent before the connection id is known", async () => {
        const { middleware, realtimeActions } = loadMiddleware();
        middleware(realtimeActions.establishConnection(MODEL_ID));
        await flush();

        jest.advanceTimersByTime(heartbeatMS * 2);

        expect(heartbeats).toHaveLength(0);
      });

      it("stops after a disconnect", async () => {
        const { middleware, realtimeActions } = await connect();

        middleware(realtimeActions.disconnect());
        await flush();
        jest.advanceTimersByTime(heartbeatMS * 3);

        expect(heartbeats).toHaveLength(0);
      });

      it("carries on after one fails", async () => {
        heartbeatResponse = () => Promise.reject(new Error("offline"));
        const { dispatch, realtimeActions } = await connect();

        // Keep-alives arrive in between, as the stream itself is fine.
        for (let i = 0; i < 4; i++) {
          if (i === 2) {
            heartbeatResponse = () =>
              Promise.resolve({ ok: true, status: 204 });
          }
          jest.advanceTimersByTime(heartbeatMS / 2);
          streams[0].push(": keepalive\n\n");
          await flush();
        }

        expect(heartbeats).toHaveLength(2);
        expect(dispatchedTypes(dispatch)).not.toContain(
          realtimeActions.disconnect.type
        );
      });

      it("disconnects when the server no longer knows the connection", async () => {
        heartbeatResponse = () => Promise.resolve({ ok: false, status: 404 });
        const { dispatch, realtimeActions } = await connect();

        jest.advanceTimersByTime(heartbeatMS);
        await flush();

        expect(dispatchedTypes(dispatch)).toContain(
          realtimeActions.disconnect.type
        );
      });
    });

    it("drops queued edits on disconnect", async () => {
      const { middleware, realtimeActions } = await connect();
      middleware({ type: "MOVE_NODES", payload: { n: 1 } });
      middleware({ type: "MOVE_NODES", payload: { n: 2 } });
      await flush();

      middleware(realtimeActions.disconnect());
      posts[0].resolve({ ok: true, status: 204 });
      await flush();

      expect(posts).toHaveLength(1);
    });

    it("tells the server it is leaving, then aborts the stream", async () => {
      const { middleware, realtimeActions } = await connect();

      middleware(realtimeActions.disconnect());
      await flush();

      expect(deletes).toHaveLength(1);
      expect(deletes[0].url).toMatch(
        new RegExp(`/api/v1/models/${MODEL_ID}/events/connection-1$`)
      );
      expect(deletes[0].options.keepalive).toBe(true);
      expect(deletes[0].options.headers.authorization).toEqual(
        "bearer test-token"
      );
      expect(streams[0].aborted).toBe(true);
    });

    it("aborts the stream at once, without waiting for the server", async () => {
      const { middleware, realtimeActions } = await connect();
      const original = global.fetch;
      global.fetch = jest.fn((url, options = {}) =>
        options.method === "DELETE"
          ? new Promise(() => {})
          : original(url, options)
      );

      middleware(realtimeActions.disconnect());
      await flush();

      expect(streams[0].aborted).toBe(true);
    });

    describe("when the leave request does not reach the server", () => {
      const failLeaves = () => {
        const original = global.fetch;
        global.fetch = jest.fn((url, options = {}) =>
          options.method === "DELETE"
            ? Promise.reject(new Error("network"))
            : original(url, options)
        );
        return original;
      };

      it("still aborts the stream", async () => {
        const { middleware, realtimeActions } = await connect();
        failLeaves();

        middleware(realtimeActions.disconnect());
        await flush();

        expect(streams[0].aborted).toBe(true);
      });

      it("tries again when it connects next", async () => {
        const { middleware, realtimeActions } = await connect();
        const original = failLeaves();
        middleware(realtimeActions.disconnect());
        await flush();
        global.fetch = original;
        deletes.length = 0;

        middleware(realtimeActions.establishConnection(MODEL_ID));
        await flush();

        expect(deletes).toHaveLength(1);
        expect(deletes[0].url).toMatch(/\/events\/connection-1$/);
      });

      it("keeps trying until it gets through, then stops", async () => {
        const { middleware, realtimeActions } = await connect();
        const original = failLeaves();
        middleware(realtimeActions.disconnect());
        await flush();

        // Still failing on the next connect: kept for the one after.
        middleware(realtimeActions.establishConnection(MODEL_ID));
        await flush();
        global.fetch = original;
        deletes.length = 0;
        middleware(realtimeActions.establishConnection(MODEL_ID));
        await flush();
        expect(deletes.map((d) => d.url).join()).toMatch(/connection-1/);

        deletes.length = 0;
        middleware(realtimeActions.establishConnection(MODEL_ID));
        await flush();
        expect(deletes.filter((d) => /connection-1$/.test(d.url))).toHaveLength(
          0
        );
      });
    });

    it("does not try again when the server no longer knows the connection", async () => {
      const { middleware, realtimeActions } = await connect();
      const original = global.fetch;
      global.fetch = jest.fn((url, options = {}) =>
        options.method === "DELETE"
          ? Promise.resolve({ ok: false, status: 404 })
          : original(url, options)
      );
      middleware(realtimeActions.disconnect());
      await flush();
      global.fetch = original;
      deletes.length = 0;

      middleware(realtimeActions.establishConnection(MODEL_ID));
      await flush();

      expect(deletes).toHaveLength(0);
    });

    it("tells the server when the page is hidden", async () => {
      await connect();

      window.dispatchEvent(new Event("pagehide"));
      await flush();

      expect(deletes).toHaveLength(1);
      expect(deletes[0].url).toMatch(/\/events\/connection-1$/);
      expect(deletes[0].options.keepalive).toBe(true);
    });

    it("tells the server only once when the page is hidden and it disconnects", async () => {
      const { middleware, realtimeActions } = await connect();

      window.dispatchEvent(new Event("pagehide"));
      middleware(realtimeActions.disconnect());
      await flush();

      expect(deletes).toHaveLength(1);
    });

    it("stops listening for the page being hidden after a disconnect", async () => {
      const { middleware, realtimeActions } = await connect();
      const remove = jest.spyOn(window, "removeEventListener");

      middleware(realtimeActions.disconnect());
      await flush();

      expect(remove).toHaveBeenCalledWith("pagehide", expect.any(Function));
    });

    it("tells the server to close the previous stream when it reconnects", async () => {
      const { middleware, realtimeActions } = await connect();

      middleware(realtimeActions.establishConnection(MODEL_ID));
      await flush();

      expect(deletes).toHaveLength(1);
      expect(deletes[0].url).toMatch(/\/events\/connection-1$/);
      expect(streams[0].aborted).toBe(true);
      expect(streams).toHaveLength(2);
    });

    it("closes a stream it left before the connection id arrived", async () => {
      const { middleware, realtimeActions, dispatch } = loadMiddleware();
      middleware(realtimeActions.establishConnection(MODEL_ID));
      await flush();

      middleware(realtimeActions.disconnect());
      await flush();
      expect(deletes).toHaveLength(0);
      expect(streams[0].aborted).toBe(false);

      streams[0].push(connectedEvent("connection-9"));
      await flush();

      expect(deletes).toHaveLength(1);
      expect(deletes[0].url).toMatch(/\/events\/connection-9$/);
      expect(streams[0].aborted).toBe(true);
      expect(dispatchedTypes(dispatch)).not.toContain(
        realtimeActions.connectionEstablished.type
      );
    });

    it("gives up on a stream it left if the connection id never arrives", async () => {
      const { middleware, realtimeActions } = loadMiddleware();
      middleware(realtimeActions.establishConnection(MODEL_ID));
      await flush();

      middleware(realtimeActions.disconnect());
      jest.advanceTimersByTime(5001);
      await flush();

      expect(streams[0].aborted).toBe(true);
      expect(deletes).toHaveLength(0);
    });
  });
});

describe("sse parser", () => {
  const parse = (...chunks) => {
    const events = [];
    const parser = createSseParser((e) => events.push(e));
    chunks.forEach((chunk) => parser.push(chunk));
    return events;
  };

  it("parses named and unnamed events", () => {
    expect(
      parse('event: connected\ndata: {"a":1}\n\ndata: {"b":2}\n\n')
    ).toEqual([
      { event: "connected", data: '{"a":1}' },
      { event: undefined, data: '{"b":2}' },
    ]);
  });

  it("ignores comments", () => {
    expect(parse(": keepalive\n\n")).toEqual([]);
  });

  it("reassembles an event split across chunks", () => {
    expect(parse("data: {", '"a":1}\n', "\n")).toEqual([
      { event: undefined, data: '{"a":1}' },
    ]);
  });
});

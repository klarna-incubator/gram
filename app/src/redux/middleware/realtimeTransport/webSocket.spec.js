import {
  dispatched,
  disconnectLoadedMiddlewares,
  dispatchedTypes,
  flush,
  loadMiddleware as load,
  MODEL_ID,
} from "./testHelpers";

describe("webSocket middleware", () => {
  const loadMiddleware = () => load("./webSocket", "webSocketMiddleware");

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    disconnectLoadedMiddlewares();
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.WebSocket;
  });

  describe("connection", () => {
    let sockets;

    beforeEach(() => {
      sockets = [];
      global.WebSocket = class {
        constructor(url) {
          this.url = url;
          this.sent = [];
          this.closed = false;
          sockets.push(this);
        }
        send(data) {
          this.sent.push(data);
        }
        close() {
          this.closed = true;
        }
      };
    });

    it("connects to the model's websocket and authenticates on open", () => {
      const { middleware, realtimeActions, dispatch } = loadMiddleware();

      middleware(realtimeActions.establishConnection(MODEL_ID));
      expect(sockets).toHaveLength(1);
      expect(sockets[0].url).toMatch(new RegExp(`/ws/model/${MODEL_ID}$`));

      sockets[0].onopen();

      expect(sockets[0].sent).toEqual([
        JSON.stringify({ token: "test-token" }),
      ]);
      expect(dispatchedTypes(dispatch)).toContain(
        realtimeActions.connectionEstablished.type
      );
      expect(dispatchedTypes(dispatch)).toContain("api/invalidateTags");
    });

    it("dispatches edits received from others as remote actions", () => {
      const { middleware, realtimeActions, dispatch } = loadMiddleware();
      middleware(realtimeActions.establishConnection(MODEL_ID));

      sockets[0].onmessage({
        data: JSON.stringify({ type: "MOVE_NODES", payload: { x: 1 } }),
      });

      expect(dispatched(dispatch)).toContainEqual({
        type: "MOVE_NODES",
        payload: { x: 1 },
        remote: true,
      });
    });

    it("invalidates the cache on a refetch notification", () => {
      const { middleware, realtimeActions, dispatch } = loadMiddleware();
      middleware(realtimeActions.establishConnection(MODEL_ID));
      dispatch.mockClear();

      sockets[0].onmessage({
        data: JSON.stringify({
          type: "REFETCH_RESOURCE",
          what: "threats",
          args: {},
        }),
      });

      expect(dispatchedTypes(dispatch)).toEqual(["api/invalidateTags"]);
    });

    it("sends local edits over the socket when connected with write access", () => {
      const { middleware, realtimeActions } = loadMiddleware();
      middleware(realtimeActions.establishConnection(MODEL_ID));

      middleware({ type: "MOVE_NODES", payload: { x: 2 } });

      expect(sockets[0].sent).toEqual([
        JSON.stringify({ type: "MOVE_NODES", payload: { x: 2 } }),
      ]);
    });

    it("disconnects when nothing is received for too long", () => {
      const { middleware, realtimeActions, dispatch } = loadMiddleware();
      middleware(realtimeActions.establishConnection(MODEL_ID));

      jest.advanceTimersByTime(15001);

      expect(dispatchedTypes(dispatch)).toContain(
        realtimeActions.disconnect.type
      );
    });
  });
});

import { loadMiddleware, flush, MODEL_ID } from "./testHelpers";

jest.mock("./sse", () => ({ sseTransport: mockTransport("sse") }));
jest.mock("./webSocket", () => ({
  webSocketTransport: mockTransport("websocket"),
}));

function mockTransport(name) {
  return { name, connect: jest.fn(), send: jest.fn(), disconnect: jest.fn() };
}

describe("realtimeMiddleware", () => {
  // dispatch resolves the config query with `config`
  const load = (config) => {
    const loaded = loadMiddleware("./index", "realtimeMiddleware");
    const { sseTransport } = require("./sse");
    const { webSocketTransport } = require("./webSocket");
    loaded.dispatch.mockResolvedValue(config);
    return { ...loaded, sseTransport, webSocketTransport };
  };

  const connect = async ({ middleware, realtimeActions }) => {
    middleware(realtimeActions.establishConnection(MODEL_ID));
    await flush();
  };

  it("connects with sse when the backend reports sse", async () => {
    const loaded = load({ data: { realtimeTransport: "sse" } });
    await connect(loaded);

    expect(loaded.sseTransport.connect).toHaveBeenCalledWith(
      loaded.dispatch,
      MODEL_ID
    );
    expect(loaded.webSocketTransport.connect).not.toHaveBeenCalled();
  });

  it("connects with websocket when the backend reports websocket", async () => {
    const loaded = load({ data: { realtimeTransport: "websocket" } });
    await connect(loaded);

    expect(loaded.webSocketTransport.connect).toHaveBeenCalled();
    expect(loaded.sseTransport.connect).not.toHaveBeenCalled();
  });

  it("falls back to websocket when the config cannot be fetched", async () => {
    const loaded = load({ error: { status: 500 } });
    await connect(loaded);

    expect(loaded.webSocketTransport.connect).toHaveBeenCalled();
  });

  it("does not connect if disconnected while waiting for the config", async () => {
    const loaded = load({ data: { realtimeTransport: "sse" } });
    loaded.middleware(loaded.realtimeActions.establishConnection(MODEL_ID));
    loaded.middleware(loaded.realtimeActions.disconnect());
    await flush();

    expect(loaded.sseTransport.connect).not.toHaveBeenCalled();
  });

  it("disconnects the transport it connected", async () => {
    const loaded = load({ data: { realtimeTransport: "sse" } });
    await connect(loaded);
    loaded.middleware(loaded.realtimeActions.disconnect());

    expect(loaded.sseTransport.disconnect).toHaveBeenCalled();
    expect(loaded.webSocketTransport.disconnect).not.toHaveBeenCalled();
  });
});

import "../../../api/gram/config";
import { api } from "../../../api/gram/api";
import { createRealtimeMiddleware } from "./realtime";
import { sseTransport } from "./sse";
import { webSocketTransport } from "./webSocket";

const transports = { sse: sseTransport, websocket: webSocketTransport };

let active;
// Incremented by every connect and disconnect, so a connect that was waiting
// for the config does nothing once it has been superseded.
let attempt = 0;

/**
 * Connects with the transport the backend reports in its config. Falls back to
 * WebSocket if the config cannot be fetched.
 */
async function connect(dispatch, modelId) {
  const current = ++attempt;
  const { data } = await dispatch(api.endpoints.getConfig.initiate());
  if (current !== attempt) return;

  active = transports[data?.realtimeTransport] ?? webSocketTransport;
  active.connect(dispatch, modelId);
}

function send(action) {
  active?.send(action);
}

function disconnect() {
  attempt++;
  active?.disconnect();
  active = undefined;
}

export const realtimeMiddleware = createRealtimeMiddleware({
  connect,
  send,
  disconnect,
});

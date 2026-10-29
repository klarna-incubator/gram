import { getAuthToken } from "../../../api/gram/util/authToken";
import { realtimeActions } from "../../realtimeSlice";
import {
  createRealtimeMiddleware,
  onConnected,
  receive,
  resetTimeout,
} from "./realtime";

// WebSocket transport

let socket;

function connect(dispatch, modelId) {
  if (socket) socket.close();

  socket = new WebSocket(
    `${document.location.protocol === "http:" ? "ws" : "wss"}://${
      document.location.host === "localhost:4726" &&
      process.env.NODE_ENV === "development"
        ? "localhost:8080" // hack as react doesnt seem to proxy the websocket correctly
        : document.location.host
    }/ws/model/${modelId}`,
    null,
    { headers: { Authorization: getAuthToken() } }
  );

  socket.onopen = () => {
    const token = getAuthToken();
    // Send token to authenticate
    socket.send(JSON.stringify({ token }));

    onConnected(dispatch);
  };

  socket.onerror = (error) => {
    dispatch(realtimeActions.error(error));
    dispatch(realtimeActions.disconnect());
  };

  socket.onmessage = (event) => receive(dispatch, event.data, modelId);

  resetTimeout(dispatch);
}

function send(action) {
  socket.send(JSON.stringify(action));
}

function disconnect() {
  if (socket) socket.close();
}

export const webSocketTransport = { connect, send, disconnect };

export const webSocketMiddleware = createRealtimeMiddleware(webSocketTransport);

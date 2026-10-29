import { BASE_URL } from "../../../api/gram/api";
import { getAuthToken } from "../../../api/gram/util/authToken";
import { realtimeActions } from "../../realtimeSlice";
import {
  createRealtimeMiddleware,
  onConnected,
  receive,
  resetTimeout,
} from "./realtime";

// Server-Sent Events transport. Events arrive on a long-lived stream, and local
// edits are posted separately.

/**
 * Minimal client for Server-Sent Events over fetch. EventSource is not used
 * because it cannot send an Authorization header, and the token must not be put
 * in the URL.
 */

/**
 * Parses a text/event-stream body. Complete events are passed to onEvent as
 * { event, data } where data is the raw string. Comments (e.g. keep-alives)
 * are ignored.
 */
export function createSseParser(onEvent) {
  let buffer = "";

  return {
    push(text) {
      buffer += text;
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop();

      for (const block of blocks) {
        const event = { event: undefined, data: undefined };
        for (const line of block.split("\n")) {
          if (line.startsWith("event: ")) {
            event.event = line.substring("event: ".length);
          } else if (line.startsWith("data: ")) {
            event.data = line.substring("data: ".length);
          }
        }
        if (event.data !== undefined || event.event !== undefined) {
          onEvent(event);
        }
      }
    },
  };
}

/**
 * Opens an event stream and resolves when it ends. onActivity is called for
 * every chunk received, including keep-alive comments, so callers can detect a
 * silent connection. Rejects if the request fails or the response is not OK.
 */
export async function openEventStream(
  url,
  { headers, signal, onEvent, onActivity }
) {
  const response = await fetch(url, {
    headers: { ...headers, accept: "text/event-stream" },
    signal,
  });

  if (!response.ok) {
    const error = new Error(`Event stream request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const parser = createSseParser(onEvent);
  const decoder = new TextDecoder();
  const reader = response.body.getReader();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    onActivity?.();
    parser.push(decoder.decode(value, { stream: true }));
  }
}

// The open stream, with the queue of edits waiting to be posted.
let connection;

// How long to wait for the connection id before aborting a stream we left.
const leaveGiveUpMS = 5000;

// How often the server is told this client is still there. The server closes a
// connection it has not heard from for much longer than this, as a safety net.
export const heartbeatMS = 20000;

// Leave requests that did not reach the server, to be tried again.
let pendingLeaves = [];
const maxPendingLeaves = 10;

const streamUrl = (modelId) => `${BASE_URL}/api/v1/models/${modelId}/events`;
const authHeaders = () => ({ authorization: `bearer ${getAuthToken()}` });

function connect(dispatch, modelId) {
  disconnect();
  retryPendingLeaves();

  const current = {
    modelId,
    dispatch,
    controller: new AbortController(),
    connectionId: null,
    queue: [],
    sending: false,
  };
  connection = current;
  resetTimeout(dispatch);
  window.addEventListener("pagehide", onPageHide);

  openEventStream(streamUrl(modelId), {
    headers: authHeaders(),
    signal: current.controller.signal,
    onActivity: () => {
      if (!current.leaving) resetTimeout(dispatch);
    },
    onEvent: ({ event, data }) => {
      if (event === "connected") {
        current.connectionId = JSON.parse(data).connectionId;
        if (current.leaving) {
          // Left before the server told us who we are; close it now.
          leave(current);
        } else {
          current.heartbeat = setInterval(
            () => sendHeartbeat(current),
            heartbeatMS
          );
          onConnected(dispatch);
        }
      } else if (!current.leaving) {
        receive(dispatch, data, modelId);
      }
    },
  })
    .then(() => {
      // The server ended the stream.
      if (connection === current) dispatch(realtimeActions.disconnect());
    })
    .catch((error) => {
      if (connection !== current || current.controller.signal.aborted) return;
      dispatch(realtimeActions.error(error));
      dispatch(realtimeActions.disconnect());
    });
}

// Edits are posted one at a time so the server receives them in the order they
// were made.
function send(action) {
  if (!connection?.connectionId) return;
  connection.queue.push(action);
  flush(connection);
}

async function flush(current) {
  if (current.sending) return;
  current.sending = true;

  while (current.queue.length > 0 && connection === current) {
    const action = current.queue.shift();
    try {
      const response = await fetch(
        `${streamUrl(current.modelId)}/${current.connectionId}`,
        {
          method: "POST",
          headers: { ...authHeaders(), "content-type": "application/json" },
          body: JSON.stringify(action),
          signal: current.controller.signal,
        }
      );
      if (response.status === 404) {
        // The server no longer knows this connection.
        current.queue = [];
        if (connection === current) {
          current.dispatch(realtimeActions.disconnect());
        }
      } else if (!response.ok) {
        console.warn(`Edit was rejected: ${response.status}`);
      }
    } catch (error) {
      if (!current.controller.signal.aborted) {
        console.warn("Failed to send edit", error);
      }
    }
  }

  current.sending = false;
}

// A missed heartbeat is not an error: the next one follows. A 404 means the
// server dropped this connection, so the client reconnects.
async function sendHeartbeat(current) {
  try {
    const response = await fetch(
      `${streamUrl(current.modelId)}/${current.connectionId}/heartbeat`,
      {
        method: "POST",
        headers: authHeaders(),
        signal: current.controller.signal,
      }
    );
    if (response.status === 404 && connection === current) {
      current.dispatch(realtimeActions.disconnect());
    }
  } catch {
    // Retried with the next heartbeat.
  }
}

function disconnect() {
  window.removeEventListener("pagehide", onPageHide);
  if (!connection) return;

  const current = connection;
  connection = null;
  current.queue = [];

  if (current.connectionId) {
    leave(current);
  } else {
    // Wait for the server to tell us the connection id so it can be closed.
    // Give up if it never does.
    current.leaving = true;
    clearInterval(current.heartbeat);
    setTimeout(() => current.controller.abort(), leaveGiveUpMS);
  }
}

// Closing the stream is not always noticed by the server, as a proxy in between
// may keep its own connection open. So the server is told to close it, which
// also removes the user from presence right away. The stream is aborted at once
// rather than after the request, as it holds one of the few connections a
// browser allows per host that the request may need.
function leave(current) {
  current.leaving = true;
  clearInterval(current.heartbeat);
  if (current.left) return;
  current.left = true;
  sendLeave(current.modelId, current.connectionId);
  current.controller.abort();
}

// keepalive lets the request finish while the page is unloading. If it does not
// reach the server (e.g. the network is down), it is tried again on the next
// connect, so a lost connection is still cleaned up.
function sendLeave(modelId, connectionId) {
  fetch(`${streamUrl(modelId)}/${connectionId}`, {
    method: "DELETE",
    headers: authHeaders(),
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok && response.status !== 404) {
        throw new Error(`Leave request failed: ${response.status}`);
      }
    })
    .catch(() => {
      if (pendingLeaves.length < maxPendingLeaves) {
        pendingLeaves.push({ modelId, connectionId });
      }
    });
}

function retryPendingLeaves() {
  const retries = pendingLeaves;
  pendingLeaves = [];
  retries.forEach(({ modelId, connectionId }) =>
    sendLeave(modelId, connectionId)
  );
}

function onPageHide() {
  if (connection?.connectionId) leave(connection);
}

export const sseTransport = { connect, send, disconnect };

export const sseMiddleware = createRealtimeMiddleware(sseTransport);

import { Server } from "http";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { config } from "@gram/core/dist/config/index.js";
import { defaultRealtimeTransport } from "@gram/core/dist/config/GramConfiguration.js";
import log4js from "log4js";
import { attachSseRealtime } from "./sse.js";
import { attachWebsocketServer } from "./ws.js";

const log = log4js.getLogger("realtime");

/**
 * Attaches the real-time transport selected by `config.realtimeTransport.type`. The
 * SSE endpoints are plain routes mounted by createApp, so for SSE this only
 * starts the notifications, cleanup and metrics. Nothing is attached for the
 * transport that is not selected.
 */
export function attachRealtime(server: Server, dal: DataAccessLayer) {
  const transport = config.realtimeTransport?.type ?? defaultRealtimeTransport;
  log.info(`real-time transport: ${transport}`);

  return transport === "sse"
    ? attachSseRealtime(dal)
    : attachWebsocketServer(server, dal);
}

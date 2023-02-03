import config from "config";
import { IncomingMessage, Server } from "http";
import url from "url";
import WebSocket from "ws";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { getLogger } from "@gram/core/dist/logger";
import { ModelWebsocketServer } from "./model";

const log = getLogger("wss");
const wssRegistry = new Map<string, ModelWebsocketServer>();

function validateRequestOrigin(request: IncomingMessage) {
  let origin = (request.headers.origin || "").trim();

  if (origin.endsWith("/") && origin.length > 1) {
    origin = origin.substring(0, origin.length - 1);
  }

  const corsOrigin = config.get("origin");
  let validOrigin = false;
  if (Array.isArray(corsOrigin)) {
    validOrigin = corsOrigin.includes(origin);
  } else {
    validOrigin = corsOrigin === origin;
  }

  if (!validOrigin) throw new Error("Invalid request origin");
}

export function attachWebsocketServer(server: Server, dal: DataAccessLayer) {
  server.on(
    "upgrade",
    async function upgrade(request: IncomingMessage, socket: any, head) {
      if (!request.url) {
        socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
        socket.destroy();
        return;
      }

      try {
        validateRequestOrigin(request);
      } catch (error: any) {
        log.warn("Unauthorized websocket connection", error);
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // /ws/model/<id>
      const pathname = url.parse(request.url).pathname;
      if (!pathname) return;
      const parts = pathname.split("/");
      const id = parts.length > 3 ? parts[3] : "invalid";

      const model = await dal.modelService.getById(id);

      if (!model) {
        log.warn("Websocket upgrade attempted for invalid model id", id);
        socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
        socket.destroy();
        return;
      }

      if (!wssRegistry.has(id)) {
        log.info(`opened new websocket server for diagram with id ${id}`);
        wssRegistry.set(id, new ModelWebsocketServer(model, dal));
      }

      const wss = wssRegistry.get(id) as ModelWebsocketServer;
      wss.server.handleUpgrade(
        request,
        socket,
        head,
        function done(client: any) {
          wss.server.emit("connection", client, request);
        }
      );
    }
  );

  log.info("websocket handler attached");

  dal.controlService.on("updated-for", ({ modelId, componentId }) => {
    const server = wssRegistry.get(modelId);
    log.debug(`controls was updated via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("controls", { modelId, componentId });
  });

  dal.controlService.on("deleted-for", ({ modelId, componentId }) => {
    const server = wssRegistry.get(modelId);
    log.debug(`control was deleted via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("controls", { modelId, componentId });
    server.tellClientsToRefetch("mitigations", { modelId, componentId });
  });

  dal.threatService.on("updated-for", ({ modelId, componentId }) => {
    const server = wssRegistry.get(modelId);
    log.debug(`threats was updated via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("threats", { modelId, componentId });
  });
  dal.threatService.on("deleted-for", ({ modelId, componentId }) => {
    const server = wssRegistry.get(modelId);
    log.debug(`threat was deleted via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("threats", { modelId, componentId });
    server.tellClientsToRefetch("mitigations", { modelId, componentId });
  });

  dal.mitigationService.on("updated-for", ({ modelId, componentId }) => {
    const server = wssRegistry.get(modelId);
    log.debug(`mitigations was updated via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("mitigations", { modelId, componentId });
  });

  dal.reviewService.on("updated-for", ({ modelId }) => {
    const server = wssRegistry.get(modelId);
    log.debug(`review was updated via api ${modelId}`);
    if (!server) return;
    server.tellClientsToRefetch("review", { modelId });
  });

  dal.suggestionService.on("updated-for", ({ modelId }) => {
    const server = wssRegistry.get(modelId);
    log.debug(`suggestions was updated for ${modelId}`);
    if (!server) return;
    server.tellClientsToRefetch("suggestions", { modelId });
  });

  // Clean up leftover websocket servers
  const cleanupInterval = setInterval(() => {
    log.debug(`Number active channels: ${wssRegistry.size}`);
    wssRegistry.forEach((wss, k) => {
      const numConnectedClients = Array.from(wss.server.clients).filter(
        (c) => c.readyState === WebSocket.OPEN
      ).length;

      log.debug(`Channel ${k} has ${numConnectedClients} connected`);

      if (numConnectedClients === 0) {
        const server = wssRegistry.get(k);
        server?.server.close();
        wssRegistry.delete(k);
      }
    });
  }, 30000);

  return { wssRegistry, cleanupInterval };
}

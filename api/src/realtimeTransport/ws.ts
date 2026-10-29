import { randomUUID } from "crypto";
import { IncomingMessage, Server } from "http";
import url from "url";
import WebSocket, { WebSocketServer } from "ws";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { UserToken } from "@gram/core/dist/auth/models/UserToken.js";
import { config } from "@gram/core/dist/config/index.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import log4js from "log4js";
import { initRealtimeMetrics } from "./metrics.js";
import { ModelRoom, RoomConnection } from "./ModelRoom.js";
import { _permissionsInterface } from "./permissions.js";
import { jwtExpiry } from "./tokenExpiry.js";
import {
  attachRoomNotifications,
  roomRegistry,
  startRoomCleanup,
} from "./rooms.js";

const log = log4js.getLogger("wss");

function validateRequestOrigin(request: IncomingMessage) {
  let origin = (request.headers.origin || "").trim();

  if (origin.endsWith("/") && origin.length > 1) {
    origin = origin.substring(0, origin.length - 1);
  }

  const corsOrigin = config.origin;
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

      if (!roomRegistry.has(id)) {
        log.info(`opened new websocket server for diagram with id ${id}`);
        roomRegistry.set(id, new ModelWebsocketServer(model, dal));
      }

      const wss = roomRegistry.get(id) as ModelWebsocketServer;
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

  attachRoomNotifications(dal);

  // Clean up leftover rooms
  const cleanupInterval = startRoomCleanup();

  initRealtimeMetrics("websocket", roomRegistry);

  return { roomRegistry, cleanupInterval };
}

/**
 * WebSocket transport for a model room: handshake, first-message
 * authentication and ping/pong liveness.
 */
export class ModelWebsocketServer extends ModelRoom {
  constructor(model: Model, dal: DataAccessLayer) {
    super(model, dal);
    this.server = new WebSocketServer({ noServer: true });
    this.bind();
  }

  server: WebSocketServer;

  /**
   * Determines in milliseconds the amount of time the server will wait
   * for a ping from the client before timing it out.
   */
  pingTimeoutMS = 15000;
  pingIntervalMS = 5000;

  /**
   * How long a socket may stay open without authenticating. Unlike the ping
   * timeout this is not extended by pongs, which any client sends automatically.
   */
  authTimeoutMS = 5000;

  /** How often open connections are checked for expiry and revoked access. */
  revalidateMS = 30000;

  wsConnections = new Map<WebSocket, RoomConnection>();

  sendPing(ws: WebSocket) {
    ws.ping();
    ws.send(JSON.stringify({ type: "NOOP" }));
  }

  // Counts every open socket, including those that have not authenticated yet.
  openConnectionCount() {
    return Array.from(this.server.clients).filter(
      (c) => c.readyState === WebSocket.OPEN
    ).length;
  }

  close() {
    this.server.close();
  }

  bind() {
    this.server.on("connection", async (ws: WebSocket) => {
      // if (!(await this.acceptNewUserConnection(ws, request))) {
      //   return;
      // }
      ws.on("message", this.authenticate(ws));

      const authTimer = setTimeout(() => {
        if (!this.wsConnections.has(ws)) {
          this.log.warn("Closing websocket that did not authenticate in time");
          ws.terminate();
        }
      }, this.authTimeoutMS);

      let timeout = setTimeout(() => this.onTimeout(ws), this.pingTimeoutMS);
      const pingInterval = setInterval(() => {
        this.sendPing(ws);
      }, this.pingIntervalMS);

      const revalidate = setInterval(async () => {
        const connection = this.wsConnections.get(ws);
        if (connection && !(await this.revalidate(connection))) ws.terminate();
      }, this.revalidateMS);

      ws.on("close", () => {
        clearInterval(revalidate);
        clearTimeout(authTimer);
        clearTimeout(timeout);
        clearInterval(pingInterval);
        this.onClose(ws);
      });

      ws.on("pong", () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          clearTimeout(timeout);
          clearInterval(pingInterval);
          this.onTimeout(ws);
          this.onClose(ws);
        }, this.pingTimeoutMS);
      });
    });
  }

  authenticate = (ws: WebSocket) => async (data: any) => {
    try {
      const { token } = JSON.parse(data);
      const user = await jwt.validateToken(token);
      const permissions = await _permissionsInterface.getPermissions(
        {},
        this.model,
        user
      );

      if (!permissions.includes(Permission.Read)) {
        ws.send(JSON.stringify({ msg: "authorization failed" }));
        ws.terminate();
        return false;
      }

      const connection = this.toConnection(ws, user, permissions);
      connection.expiresAt = jwtExpiry(token);
      ws.removeAllListeners("message");
      ws.on("message", (message: any) =>
        this.handleMessage(connection, message)
      );
      this.wsConnections.set(ws, connection);
      this.addConnection(connection);
    } catch (e) {
      ws.send(JSON.stringify({ msg: "authentication failed" }));
      ws.terminate();
      return false;
    }
  };

  toConnection(
    ws: WebSocket,
    user: UserToken,
    permissions: Permission[]
  ): RoomConnection {
    return {
      id: randomUUID(),
      user,
      permissions,
      send: (message) => ws.send(message),
      isOpen: () => ws.readyState === WebSocket.OPEN,
      close: () => ws.terminate(),
    };
  }

  onTimeout = (timedoutWs: WebSocket) => {
    const connection = this.wsConnections.get(timedoutWs);
    this.log.info(`Socket for ${connection?.user.sub} timed out`);
    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    timedoutWs.terminate();
  };

  onClose = (closedWs: WebSocket, skipPublish?: boolean) => {
    const connection = this.wsConnections.get(closedWs);
    this.wsConnections.delete(closedWs);
    if (connection) this.removeConnection(connection, true);
    if (!skipPublish) this.publishUserList();
  };
}

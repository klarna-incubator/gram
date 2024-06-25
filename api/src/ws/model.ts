import WebSocket, { WebSocketServer } from "ws";
import {
  getPermissionsForModel,
  Permission,
} from "@gram/core/dist/auth/authorization.js";
import { UserToken } from "@gram/core/dist/auth/models/UserToken.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import log4js from "log4js";
import * as jwt from "@gram/core/dist/auth/jwt.js";

// Hack to easily mock the permissions for testing.
export const _permissionsInterface = {
  getPermissions: getPermissionsForModel,
};

export class ModelWebsocketServer {
  constructor(model: Model, dal: DataAccessLayer) {
    this.id = model.id!;
    this.model = model;
    this.dal = dal;
    this.server = new WebSocketServer({ noServer: true });
    this.log = log4js.getLogger(`ModelWebsocketServer [${this.id}]`);
    this.bind();
  }

  id: string;
  model: Model;
  dal: DataAccessLayer;
  server: WebSocketServer;
  log: any;

  VALID_TYPES = [
    "ADD_COMPONENT",
    "ADD_DATA_FLOW",
    "DELETE_NODES",
    "PATCH_COMPONENT",
    "PATCH_DATA_FLOW",
    "PATCH_VERSION",
    "MOVE_NODES",
  ];

  /**
   * Determines in milliseconds the amount of time the server will wait
   * for a ping from the client before timing it out.
   */
  pingTimeoutMS = 15000;
  pingIntervalMS = 5000;

  wsUserMap: {
    ws: WebSocket;
    user: UserToken;
    permissions: Permission[];
  }[] = [];

  get activeUsers() {
    return Array.from(
      new Set(
        this.wsUserMap
          .filter(({ ws }) => ws.readyState === WebSocket.OPEN)
          .map(({ user }) => ({
            sub: user.sub,
            name: user.name,
            picture: user.picture,
          }))
      ).keys()
    );
  }

  tellClientsToRefetch(what: string, args: any) {
    this.broadcast(null, { type: "REFETCH_RESOURCE", what, args });
  }

  broadcast(sender: WebSocket | null, msg: any) {
    this.wsUserMap.forEach(({ ws, permissions }) => {
      if (
        ws !== sender &&
        ws.readyState === WebSocket.OPEN &&
        permissions.includes(Permission.Read)
      ) {
        ws.send(JSON.stringify(msg));
      }
    });
  }

  sendPing(ws: WebSocket) {
    ws.ping();
    ws.send(JSON.stringify({ type: "NOOP" }));
  }

  publishUserList() {
    this.broadcast(null, {
      type: "webSocket/activeUsers",
      payload: {
        users: this.activeUsers,
      },
    });
  }

  bind() {
    this.server.on("connection", async (ws: WebSocket) => {
      // if (!(await this.acceptNewUserConnection(ws, request))) {
      //   return;
      // }
      ws.on("message", this.authenticate(ws));

      let timeout = setTimeout(() => this.onTimeout(ws), this.pingTimeoutMS);
      const pingInterval = setInterval(() => {
        this.sendPing(ws);
      }, this.pingIntervalMS);

      ws.on("close", (ws: WebSocket) => {
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

      ws.removeAllListeners("message");
      ws.on("message", this.onMessage(ws, user));
      this.wsUserMap.push({
        ws,
        user,
        permissions,
      });
      this.publishUserList();
    } catch (e) {
      ws.send(JSON.stringify({ msg: "authentication failed" }));
      ws.terminate();
      return false;
    }
  };

  validate = (sender: WebSocket, msg: any) => {
    if (!this.VALID_TYPES.includes(msg.type)) {
      sender.send(
        JSON.stringify({
          type: "WS_ERROR",
          message: `Invalid type ${msg.type}`,
        })
      );
      this.log.warn(`received invalid websocket packet: ${msg.type}`);
      return false;
    }
    return true;
  };

  checkPermission = (sender: WebSocket, perm: Permission) => {
    const tuple = this.wsUserMap.find(({ ws }) => ws === sender);
    if (!tuple?.permissions.includes(perm)) {
      sender.send(
        JSON.stringify({
          type: "WS_UNAUTHORIZED",
          message: `You're not authorized to ${perm}`,
        })
      );
      this.log.warn(
        `unauthorized ${perm} to ws was attempted by: ${tuple?.user.sub}`
      );
      return false;
    }
    return true;
  };

  onTimeout = (timedoutWs: WebSocket) => {
    const tuple = this.wsUserMap.find(({ ws }) => ws === timedoutWs);
    this.log.info(`Socket for ${tuple?.user.sub} timed out`);
    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    timedoutWs.terminate();
  };

  onClose = (sender: WebSocket, skipPublish?: boolean) => {
    this.wsUserMap = this.wsUserMap.filter(({ ws }) => ws !== sender);
    if (!skipPublish) this.publishUserList();
  };

  onMessage = (sender: WebSocket, user: UserToken) => (data: any) => {
    this.log.info(`${this.id} Received message ${data} from user ${user.sub}`);

    if (!this.checkPermission(sender, Permission.Write)) {
      return;
    }

    const original = JSON.parse(data);
    if (!this.validate(sender, original)) {
      return;
    }

    const msg = {
      ...original,
      from: {
        sub: user.sub,
        name: user.name,
        picture: user.picture,
      },
    };

    this.broadcast(sender, msg);
  };
}

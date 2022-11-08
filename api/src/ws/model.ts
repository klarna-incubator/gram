import WebSocket from "ws";
import { getPermissionsForModel, Permission } from "../auth/authorization";
import { UserToken } from "../auth/models/UserToken";
import { DataAccessLayer } from "../data/dal";
import Model from "../data/models/Model";
import { getLogger } from "../logger";
import { AuthenticatedIncomingMessage } from "./types";

export class ModelWebsocketServer {
  constructor(model: Model, dal: DataAccessLayer) {
    this.id = model.id!;
    this.model = model;
    this.dal = dal;
    this.server = new WebSocket.Server({ noServer: true });
    this.log = getLogger(`ModelWebsocketServer [${this.id}]`);
    this.bind();
  }

  id: string;
  model: Model;
  dal: DataAccessLayer;
  server: WebSocket.Server;
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
    this.server.clients.forEach((client: any) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    });
  }

  async acceptNewUserConnection(
    ws: WebSocket,
    request: AuthenticatedIncomingMessage
  ) {
    const permissions = await getPermissionsForModel(this.model, request.user);

    if (!permissions.includes(Permission.Read)) {
      ws.terminate();
      return false;
    }

    this.wsUserMap.push({
      ws,
      user: request.user,
      permissions,
    });
    return true;
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
    this.server.on(
      "connection",
      async (ws: WebSocket, request: AuthenticatedIncomingMessage) => {
        if (!(await this.acceptNewUserConnection(ws, request))) {
          return;
        }

        this.publishUserList();

        let timeout = setTimeout(() => this.onTimeout(ws), this.pingTimeoutMS);
        const pingInterval = setInterval(() => {
          this.sendPing(ws);
        }, this.pingIntervalMS);

        ws.on("message", this.onMessage(ws, request.user));

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
      }
    );
  }

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

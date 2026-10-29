import { Permission } from "@gram/core/dist/auth/authorization.js";
import { UserToken } from "@gram/core/dist/auth/models/UserToken.js";
import { config } from "@gram/core/dist/config/index.js";
import { defaultRealtimeTransport } from "@gram/core/dist/config/GramConfiguration.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import log4js from "log4js";
import { _permissionsInterface } from "./permissions.js";

/**
 * A client of a room, independent of the transport it is connected over.
 */
export interface RoomConnection {
  id: string;
  user: UserToken;
  permissions: Permission[];
  /** When the credential the connection was opened with expires (epoch ms). */
  expiresAt?: number;
  send(message: string): void;
  isOpen(): boolean;
  /** Ends the connection from the server's side, if the transport allows it. */
  close?(): void;
}

/**
 * The clients collaborating on one model. Holds everything that does not
 * depend on the transport: permissions, edit validation, broadcast, refetch
 * notifications and presence. Transports add and remove connections.
 */
export class ModelRoom {
  constructor(model: Model, dal: DataAccessLayer) {
    this.id = model.id!;
    this.model = model;
    this.dal = dal;
    this.log = log4js.getLogger(`ModelRoom [${this.id}]`);
  }

  id: string;
  model: Model;
  dal: DataAccessLayer;
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

  connections: RoomConnection[] = [];

  /** The configured transport, as shown in logs and error message types. */
  get transport() {
    return config.realtimeTransport?.type ?? defaultRealtimeTransport;
  }

  private get errorPrefix() {
    return this.transport === "sse" ? "SSE" : "WS";
  }

  get activeUsers() {
    return Array.from(
      new Set(
        this.connections
          .filter((connection) => connection.isOpen())
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

  broadcast(sender: RoomConnection | null, msg: any) {
    this.connections.forEach((connection) => {
      if (
        connection !== sender &&
        connection.isOpen() &&
        connection.permissions.includes(Permission.Read)
      ) {
        connection.send(JSON.stringify(msg));
      }
    });
  }

  publishUserList() {
    this.broadcast(null, {
      type: "realtime/activeUsers",
      payload: {
        users: this.activeUsers,
      },
    });
  }

  addConnection(connection: RoomConnection) {
    this.connections.push(connection);
    this.publishUserList();
  }

  removeConnection(connection: RoomConnection, skipPublish?: boolean) {
    this.connections = this.connections.filter((c) => c !== connection);
    if (!skipPublish) this.publishUserList();
  }

  /**
   * The number of clients that are currently connected, used to decide when
   * an idle room can be dropped.
   */
  openConnectionCount() {
    return this.connections.filter((connection) => connection.isOpen()).length;
  }

  /**
   * Re-checks a connection that has been open for a while: its credential must
   * not have expired and the user must still be allowed to read the model.
   * Refreshes the connection's permissions. Returns false if it must be closed.
   */
  async revalidate(connection: RoomConnection): Promise<boolean> {
    if (
      connection.expiresAt !== undefined &&
      Date.now() >= connection.expiresAt
    ) {
      return false;
    }
    try {
      const permissions = await _permissionsInterface.getPermissions(
        {},
        this.model,
        connection.user
      );
      connection.permissions = permissions;
      return permissions.includes(Permission.Read);
    } catch (e) {
      this.log.warn("Could not re-check permissions", e);
      return true; // do not drop clients because of a transient failure
    }
  }

  /**
   * Releases transport resources when the room is dropped.
   */
  close() {}

  /** Largest edit (bytes of JSON) that is relayed to the other clients. */
  static MAX_MESSAGE_BYTES = 256 * 1024;
  /** Edits a connection may send per window; more are rejected. */
  static MAX_MESSAGES_PER_WINDOW = 1000;
  static RATE_WINDOW_MS = 10000;

  private rateLimits = new WeakMap<
    RoomConnection,
    { windowStart: number; count: number }
  >();

  private withinRateLimit(sender: RoomConnection) {
    const now = Date.now();
    let state = this.rateLimits.get(sender);
    if (!state || now - state.windowStart >= ModelRoom.RATE_WINDOW_MS) {
      state = { windowStart: now, count: 0 };
      this.rateLimits.set(sender, state);
    }
    return ++state.count <= ModelRoom.MAX_MESSAGES_PER_WINDOW;
  }

  handleMessage = (
    sender: RoomConnection,
    data: any
  ): "accepted" | "unauthorized" | "invalid" | "too_large" | "rate_limited" => {
    if (!this.checkPermission(sender, Permission.Write)) {
      return "unauthorized";
    }

    if (Buffer.byteLength(data) > ModelRoom.MAX_MESSAGE_BYTES) {
      this.log.warn("Realtime message too large", {
        payload: { user: sender.user.sub, bytes: Buffer.byteLength(data) },
      });
      return "too_large";
    }

    if (!this.withinRateLimit(sender)) {
      this.log.warn("Realtime message rate limit exceeded", {
        payload: { user: sender.user.sub },
      });
      return "rate_limited";
    }

    let original: any;
    try {
      original = JSON.parse(data);
    } catch {
      return "invalid";
    }
    if (typeof original !== "object" || original === null) return "invalid";

    this.log.debug(
      `${this.id} Received ${original.type} from user ${sender.user.sub}`
    );

    if (!this.validate(sender, original)) {
      return "invalid";
    }

    const msg = {
      ...original,
      from: {
        sub: sender.user.sub,
        name: sender.user.name,
        picture: sender.user.picture,
      },
    };

    this.broadcast(sender, msg);
    return "accepted";
  };

  validate = (sender: RoomConnection, msg: any) => {
    if (!this.VALID_TYPES.includes(msg.type)) {
      sender.send(
        JSON.stringify({
          type: `${this.errorPrefix}_ERROR`,
          message: `Invalid type ${msg.type}`,
        })
      );
      this.log.warn("Received invalid packet for realtime transport", {
        payload: { type: this.transport, packet: msg.type },
      });
      return false;
    }
    return true;
  };

  checkPermission = (sender: RoomConnection, perm: Permission) => {
    if (!sender.permissions.includes(perm)) {
      sender.send(
        JSON.stringify({
          type: `${this.errorPrefix}_UNAUTHORIZED`,
          message: `You're not authorized to ${perm}`,
        })
      );
      this.log.warn(`Unauthorized action for realtime transport`, {
        payload: { perm, type: this.transport, user: sender.user.sub },
      });

      return false;
    }
    return true;
  };
}

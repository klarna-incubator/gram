import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { genUser } from "@gram/core/dist/test-util/authz.js";
import { jest } from "@jest/globals";
import { ModelRoom, RoomConnection } from "./ModelRoom.js";
import { _permissionsInterface } from "./permissions.js";

function createRoom() {
  const model = new Model("system-id", "Gram", "root");
  model.id = "model-id";
  return new ModelRoom(model, {} as DataAccessLayer);
}

function createConnection(
  sub: string,
  permissions: Permission[] = [Permission.Read, Permission.Write]
) {
  const sent: any[] = [];
  let open = true;
  const connection: RoomConnection = {
    id: `connection-${sub}`,
    user: genUser({ sub }),
    permissions,
    send: (message) => sent.push(JSON.parse(message)),
    isOpen: () => open,
  };
  return { connection, sent, close: () => (open = false) };
}

describe("ModelRoom", () => {
  describe("revalidate", () => {
    afterEach(() => jest.restoreAllMocks());

    it("keeps a connection whose access is unchanged, refreshing permissions", async () => {
      jest
        .spyOn(_permissionsInterface, "getPermissions")
        .mockResolvedValue([Permission.Read]);
      const { connection } = createConnection("a@abc.xyz");
      expect(await createRoom().revalidate(connection)).toBe(true);
      expect(connection.permissions).toEqual([Permission.Read]);
    });

    it("rejects a connection that lost read access", async () => {
      jest.spyOn(_permissionsInterface, "getPermissions").mockResolvedValue([]);
      const { connection } = createConnection("a@abc.xyz");
      expect(await createRoom().revalidate(connection)).toBe(false);
    });

    it("rejects a connection whose credential has expired", async () => {
      const spy = jest
        .spyOn(_permissionsInterface, "getPermissions")
        .mockResolvedValue([Permission.Read]);
      const { connection } = createConnection("a@abc.xyz");
      connection.expiresAt = Date.now() - 1;
      expect(await createRoom().revalidate(connection)).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("presence", () => {
    it("announces the user list to everyone when a connection is added", () => {
      const room = createRoom();
      const first = createConnection("first@abc.xyz");
      const second = createConnection("second@abc.xyz");

      room.addConnection(first.connection);
      room.addConnection(second.connection);

      const last = first.sent[first.sent.length - 1];
      expect(last.type).toEqual("realtime/activeUsers");
      expect(last.payload.users.map((u: any) => u.sub)).toEqual([
        "first@abc.xyz",
        "second@abc.xyz",
      ]);
      expect(second.sent).toHaveLength(1);
    });

    it("announces the remaining users when a connection is removed", () => {
      const room = createRoom();
      const first = createConnection("first@abc.xyz");
      const second = createConnection("second@abc.xyz");
      room.addConnection(first.connection);
      room.addConnection(second.connection);

      room.removeConnection(second.connection);

      const last = first.sent[first.sent.length - 1];
      expect(last.payload.users.map((u: any) => u.sub)).toEqual([
        "first@abc.xyz",
      ]);
      expect(room.connections).toHaveLength(1);
    });

    it("does not announce when asked to skip publishing", () => {
      const room = createRoom();
      const first = createConnection("first@abc.xyz");
      const second = createConnection("second@abc.xyz");
      room.addConnection(first.connection);
      room.addConnection(second.connection);
      const before = first.sent.length;

      room.removeConnection(second.connection, true);

      expect(first.sent).toHaveLength(before);
    });

    it("leaves closed connections out of the user list and the count", () => {
      const room = createRoom();
      const first = createConnection("first@abc.xyz");
      const second = createConnection("second@abc.xyz");
      room.addConnection(first.connection);
      room.addConnection(second.connection);

      second.close();

      expect(room.activeUsers.map((u) => u.sub)).toEqual(["first@abc.xyz"]);
      expect(room.openConnectionCount()).toEqual(1);
    });
  });

  describe("broadcast", () => {
    it("does not send to the sender", () => {
      const room = createRoom();
      const sender = createConnection("sender@abc.xyz");
      const other = createConnection("other@abc.xyz");
      room.addConnection(sender.connection);
      room.addConnection(other.connection);
      sender.sent.length = 0;
      other.sent.length = 0;

      room.broadcast(sender.connection, { type: "MOVE_NODES" });

      expect(sender.sent).toHaveLength(0);
      expect(other.sent).toEqual([{ type: "MOVE_NODES" }]);
    });

    it("skips closed connections and those without read permission", () => {
      const room = createRoom();
      const closed = createConnection("closed@abc.xyz");
      const noRead = createConnection("noread@abc.xyz", []);
      const open = createConnection("open@abc.xyz");
      room.addConnection(closed.connection);
      room.addConnection(noRead.connection);
      room.addConnection(open.connection);
      closed.close();
      closed.sent.length = 0;
      noRead.sent.length = 0;
      open.sent.length = 0;

      room.broadcast(null, { type: "MOVE_NODES" });

      expect(closed.sent).toHaveLength(0);
      expect(noRead.sent).toHaveLength(0);
      expect(open.sent).toEqual([{ type: "MOVE_NODES" }]);
    });

    it("tells clients to refetch a resource", () => {
      const room = createRoom();
      const client = createConnection("client@abc.xyz");
      room.addConnection(client.connection);
      client.sent.length = 0;

      room.tellClientsToRefetch("threats", { modelId: "model-id" });

      expect(client.sent).toEqual([
        {
          type: "REFETCH_RESOURCE",
          what: "threats",
          args: { modelId: "model-id" },
        },
      ]);
    });
  });

  describe("handleMessage", () => {
    it("rejects an oversized edit without relaying it", () => {
      const room = createRoom();
      const sender = createConnection("sender@abc.xyz");
      const other = createConnection("other@abc.xyz");
      room.addConnection(sender.connection);
      room.addConnection(other.connection);
      other.sent.length = 0;

      const result = room.handleMessage(
        sender.connection,
        JSON.stringify({
          type: "MOVE_NODES",
          payload: "x".repeat(ModelRoom.MAX_MESSAGE_BYTES),
        })
      );

      expect(result).toEqual("too_large");
      expect(other.sent).toHaveLength(0);
    });

    it("rejects edits above the rate limit, per connection", () => {
      const room = createRoom();
      const sender = createConnection("sender@abc.xyz");
      const msg = JSON.stringify({ type: "MOVE_NODES", payload: {} });

      for (let i = 0; i < ModelRoom.MAX_MESSAGES_PER_WINDOW; i++) {
        expect(room.handleMessage(sender.connection, msg)).toEqual("accepted");
      }
      expect(room.handleMessage(sender.connection, msg)).toEqual(
        "rate_limited"
      );
    });

    it("rejects malformed JSON", () => {
      const room = createRoom();
      const sender = createConnection("sender@abc.xyz");
      expect(room.handleMessage(sender.connection, "{nope")).toEqual("invalid");
    });

    it("broadcasts a valid edit to the others with the sender attached", () => {
      const room = createRoom();
      const sender = createConnection("sender@abc.xyz");
      const other = createConnection("other@abc.xyz");
      room.addConnection(sender.connection);
      room.addConnection(other.connection);
      sender.sent.length = 0;
      other.sent.length = 0;

      room.handleMessage(
        sender.connection,
        JSON.stringify({ type: "MOVE_NODES", payload: { x: 1 } })
      );

      expect(sender.sent).toHaveLength(0);
      expect(other.sent).toHaveLength(1);
      expect(other.sent[0]).toMatchObject({
        type: "MOVE_NODES",
        payload: { x: 1 },
        from: { sub: "sender@abc.xyz" },
      });
    });

    it("rejects an edit from a user without write permission", () => {
      const room = createRoom();
      const reader = createConnection("reader@abc.xyz", [Permission.Read]);
      const other = createConnection("other@abc.xyz");
      room.addConnection(reader.connection);
      room.addConnection(other.connection);
      reader.sent.length = 0;
      other.sent.length = 0;

      room.handleMessage(
        reader.connection,
        JSON.stringify({ type: "MOVE_NODES" })
      );

      expect(reader.sent).toHaveLength(1);
      expect(reader.sent[0].type).toEqual("WS_UNAUTHORIZED");
      expect(other.sent).toHaveLength(0);
    });

    it("rejects an edit with an invalid type", () => {
      const room = createRoom();
      const sender = createConnection("sender@abc.xyz");
      const other = createConnection("other@abc.xyz");
      room.addConnection(sender.connection);
      room.addConnection(other.connection);
      sender.sent.length = 0;
      other.sent.length = 0;

      room.handleMessage(
        sender.connection,
        JSON.stringify({ type: "REFETCH_RESOURCE" })
      );

      expect(sender.sent).toHaveLength(1);
      expect(sender.sent[0].type).toEqual("WS_ERROR");
      expect(other.sent).toHaveLength(0);
    });
  });
});

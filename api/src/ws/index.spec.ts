import { jest } from "@jest/globals";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { createPostgresPool } from "@gram/core/dist/data/postgres.js";
import { randomUUID } from "crypto";
import express from "express";
import http from "http";
import WebSocket from "ws";
import * as ws from "./index.js";
import { genUser } from "@gram/core/dist/test-util/authz.js";
import { sampleOwnedSystem } from "../test-util/sampleOwnedSystem.js";
import { ModelWebsocketServer, _permissionsInterface } from "./model.js";

const receive = (client: WebSocket, t = 500) =>
  new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => reject("receive message timed out"), t);
    client.on("message", (e) => {
      client.removeAllListeners(); // Hack, may need to buffer incoming msgs separately.
      clearTimeout(timeout);
      resolve(e);
    });
  });

const connected = (client: WebSocket) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject("connect timed out"), 400);
    client.on("open", (e: any) => {
      resolve(true);
      clearTimeout(timeout);
      client.removeAllListeners();
    });
    client.on("error", reject);
  });

describe("websocket protocol", () => {
  let dal: DataAccessLayer;

  let modelGetById: any;
  const getPermissionsForModel = jest.spyOn(
    _permissionsInterface,
    "getPermissions"
  );

  const app = express();
  const appServer = http.createServer(app);
  let wssRegistry: any;
  let cleanupInterval: any;
  let firstClient: WebSocket | null = null;
  let secondClient: WebSocket | null = null;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    modelGetById = jest.spyOn(dal.modelService, "getById");
    ({ wssRegistry, cleanupInterval } = ws.attachWebsocketServer(
      appServer,
      dal
    ));
  });

  beforeEach(() => {
    wssRegistry.clear();

    getPermissionsForModel.mockImplementation(async () => {
      return [Permission.Read, Permission.Write];
    });

    modelGetById.mockImplementation(async (id: string) => {
      const model = new Model(sampleOwnedSystem.id, "Gram", "root");
      model.id = id;
      model.createdAt = Date.now();
      model.updatedAt = Date.now();
      return model;
    });
  });

  beforeAll((done) => {
    appServer.listen(8123, (err?: Error) => {
      if (err) return done(err);
      done();
    });
  });

  afterEach(() => {
    modelGetById.mockReset();
    getPermissionsForModel.mockReset();
    try {
      firstClient?.terminate();
    } catch (err: any) {
      console.log("firstClient failed to terminate", err);
    }
    try {
      secondClient?.terminate();
    } catch (err: any) {
      console.log("secondClient failed to terminate", err);
    }
  });

  afterAll((done) => {
    appServer.close(done);
    clearInterval(cleanupInterval);
  });

  it("should announce new connected users to other clients", async () => {
    firstClient = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      { headers: { sub: "first@abc.xyz", origin: "http://localhost:4726" } }
    );
    await connected(firstClient);
    firstClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "first@abc.xyz" })),
      })
    );
    secondClient = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      { headers: { sub: "second@abc.xyz", origin: "http://localhost:4726" } }
    );
    await connected(secondClient);
    secondClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "second@abc.xyz" })),
      })
    );

    const received = await receive(firstClient);
    const parsed = JSON.parse(received);
    expect(parsed.type).toEqual("webSocket/activeUsers");
    expect(parsed.payload.users).toHaveLength(2);
  });

  it("should broadcast received messages to other clients", async () => {
    firstClient = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      { headers: { origin: "http://localhost:4726" } }
    );
    await connected(firstClient);
    firstClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "first@abc.xyz" })),
      })
    );

    const msg = { type: "ADD_COMPONENT", message: "Hello from second client" };
    secondClient = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      { headers: { origin: "http://localhost:4726" } }
    );
    await connected(secondClient);
    secondClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "second@abc.xyz" })),
      })
    );

    let received = await receive(firstClient); // second user joining
    // console.log(received);
    secondClient.send(JSON.stringify(msg));
    received = await receive(firstClient);
    // console.log(received);
    const parsed = JSON.parse(received);
    expect(parsed.message).toEqual(msg.message);
    expect(parsed.from.sub).toContain("second@abc.xyz");
  });

  it("must only allow authenticated clients", async () => {
    firstClient = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      { headers: { origin: "http://localhost:4726" } }
    );
    await connected(firstClient);
    firstClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "first@abc.xyz" })),
      })
    );
    // let received =
    await receive(firstClient);
    // console.log(received);
    // expect(
    //   await new Promise((resolve, _) =>
    //     firstClient?.on("error", (e) => resolve(e.message))
    //   )
    // ).toContain("Unexpected server response: 401");
    expect(receive(firstClient, 500)).rejects.toMatch(
      "receive message timed out"
    );
  });

  it("must reject users with no read permission", async () => {
    getPermissionsForModel.mockImplementation(async () => []);

    firstClient = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      { headers: { sub: "first@abc.xyz", origin: "http://localhost:4726" } }
    );
    await connected(firstClient);
    firstClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "first@abc.xyz" })),
      })
    );
    expect(receive(firstClient, 500)).rejects.toMatch(
      "receive message timed out"
    );
  });

  it("should reject invalid model ids", async () => {
    modelGetById.mockImplementation(async (id: string) => null);

    const firstClient = new WebSocket("http://localhost:8123/api/ws/penguin", {
      headers: { origin: "http://localhost:4726" },
    });
    expect(
      await new Promise((resolve, _) =>
        firstClient?.on("error", (e) => {
          console.log(e);
          resolve(e.message);
        })
      )
    ).toContain("400");
  });

  it("should send out pings from server", async () => {
    firstClient = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      {
        headers: { origin: "http://localhost:4726" },
      }
    );
    await connected(firstClient);
    firstClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "first@abc.xyz" })),
      })
    );

    expect(
      new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 1000);
        firstClient?.on("ping", (e) => {
          clearTimeout(timeout);
          resolve(true);
        });
      })
    ).toBeTruthy();
  });

  it("should detect disconnected clients", async () => {
    const id = randomUUID();
    const server = new ModelWebsocketServer(
      new Model(id, "whatever", "hello"),
      dal
    );
    server.pingTimeoutMS = 500; // Set timeout to something low to speed up this test.
    wssRegistry.set(id, server);

    firstClient = new WebSocket(`http://localhost:8123/api/ws/${id}`, {
      headers: { origin: "http://localhost:4726" },
    });
    await connected(firstClient);
    firstClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "first@abc.xyz" })),
      })
    );

    secondClient = new WebSocket(`http://localhost:8123/api/ws/${id}`, {
      headers: { origin: "http://localhost:4726" },
    });
    await connected(secondClient);
    secondClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "second@abc.xyz" })),
      })
    );

    let received = await receive(firstClient); // second user joining
    let parsed = JSON.parse(received);
    expect(parsed.type).toEqual("webSocket/activeUsers");
    expect(parsed.payload.users).toHaveLength(2);

    secondClient.terminate(); // simulate second user disconnecting in an unclean manner

    received = await receive(firstClient, 2000); // second user joining, wait up to 2000 ms to receive the message to ensure timeout kicks in
    parsed = JSON.parse(received);
    expect(parsed.type).toEqual("webSocket/activeUsers");
    expect(parsed.payload.users).toHaveLength(1);
    expect(parsed.payload.users[0].sub).toEqual("first@abc.xyz");
  });

  it("should only reflect valid whitelisted packets", async () => {
    const id = randomUUID();
    const server = new ModelWebsocketServer(
      new Model(id, "whatever", "hello"),
      dal
    );
    server.pingTimeoutMS = 500; // Set timeout to something low to speed up this test.
    wssRegistry.set(id, server);

    firstClient = new WebSocket(`http://localhost:8123/api/ws/${id}`, {
      headers: { sub: "first@abc.xyz", origin: "http://localhost:4726" },
    });
    await connected(firstClient);
    firstClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "first@abc.xyz" })),
      })
    );

    secondClient = new WebSocket(`http://localhost:8123/api/ws/${id}`, {
      headers: { sub: "second@abc.xyz", origin: "http://localhost:4726" },
    });
    await connected(secondClient);
    secondClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "second@abc.xyz" })),
      })
    );
    await receive(firstClient); // second user joining

    let received = receive(firstClient);
    firstClient.send(JSON.stringify({ type: "invalid" }));
    let parsed = JSON.parse(await received);
    expect(parsed.type).toEqual("WS_ERROR");

    received = receive(secondClient); // second user should get the message
    firstClient.send(JSON.stringify({ type: "ADD_COMPONENT" }));
    parsed = JSON.parse(await received);
    expect(parsed.type).toEqual("ADD_COMPONENT");
  });

  it("should reject packets from users with no write permission", async () => {
    getPermissionsForModel.mockImplementation(async () => [Permission.Read]);

    const id = randomUUID();
    const server = new ModelWebsocketServer(
      new Model(id, "whatever", "hello"),
      dal
    );
    server.pingTimeoutMS = 500; // Set timeout to something low to speed up this test.
    wssRegistry.set(id, server);

    firstClient = new WebSocket(`http://localhost:8123/api/ws/${id}`, {
      headers: { origin: "http://localhost:4726" },
    });
    await connected(firstClient);
    firstClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "first@abc.xyz" })),
      })
    );

    secondClient = new WebSocket(`http://localhost:8123/api/ws/${id}`, {
      headers: { origin: "http://localhost:4726" },
    });
    await connected(secondClient);
    secondClient.send(
      JSON.stringify({
        token: await jwt.generateToken(genUser({ sub: "second@abc.xyz" })),
      })
    );
    await receive(firstClient); // second user joining

    const received = receive(firstClient);
    firstClient.send(JSON.stringify({ type: "ADD_COMPONENT" }));
    const parsed = JSON.parse(await received);
    expect(parsed.type).toEqual("WS_UNAUTHORIZED");

    firstClient.send(JSON.stringify({ type: "ADD_COMPONENT" }));
    expect(receive(secondClient, 500)).rejects.toMatch(
      "receive message timed out"
    );
  });

  it("must only allow clients from a valid origin (i.e. no CSRF) - invalid origin", async () => {
    const client = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      {
        headers: { origin: "http://unauthorized-origin" },
      }
    );
    expect(
      await new Promise((resolve, _) =>
        client?.on("error", (e) => resolve(e.message))
      )
    ).toContain("Unexpected server response: 401");
  });

  it("must only allow clients from a valid origin (i.e. no CSRF) - invalid port", async () => {
    const client = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      {
        headers: { origin: "http://localhost:1111" },
      }
    );
    expect(
      await new Promise((resolve, _) =>
        client?.on("error", (e) => resolve(e.message))
      )
    ).toContain("Unexpected server response: 401");
  });

  it("must allow clients from a valid origin (i.e. no CSRF) - with trailing /", async () => {
    firstClient = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      {
        headers: { origin: "http://localhost:4726/" },
      }
    );

    const connect = await connected(firstClient);
    expect(connect).toBeTruthy();
  });

  it("must allow clients from a valid origin (i.e. no CSRF) - without trailing /", async () => {
    firstClient = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      {
        headers: { sub: "first@abc.xyz", origin: "http://localhost:4726" },
      }
    );

    const connect = await connected(firstClient);
    expect(connect).toBeTruthy();
  });

  it("must only allow clients from a valid origin (i.e. no CSRF) - no specified origin", async () => {
    const client = new WebSocket(
      "http://localhost:8123/api/ws/ae269267-d025-49ba-9f5b-126e938e4c89",
      {
        headers: { sub: "first@abc.xyz" },
      }
    );
    expect(
      await new Promise((resolve, _) =>
        client?.on("error", (e) => resolve(e.message))
      )
    ).toContain("Unexpected server response: 401");
  });
});

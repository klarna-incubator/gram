import { randomUUID } from "crypto";
import express, { Request, Response } from "express";
import { config } from "@gram/core/dist/config/index.js";
import { AuthzError } from "@gram/core/dist/auth/AuthzError.js";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { NotFoundError } from "@gram/core/dist/util/errors.js";
import { routeParams } from "../util/routeParams.js";
import { initRealtimeMetrics } from "./metrics.js";
import { _permissionsInterface } from "./permissions.js";
import { bearerTokenExpiry } from "./tokenExpiry.js";
import { ModelRoom, RoomConnection } from "./ModelRoom.js";
import {
  attachRoomNotifications,
  roomRegistry,
  startRoomCleanup,
} from "./rooms.js";

/**
 * Defaults of the SSE settings. `realtimeTransport.sse` in the config files
 * overrides them one by one; see `getSseSettings`.
 *
 * keepAliveMS: how often a keep-alive is written to each open stream. The
 *   client treats 15s of silence as lost (`timeoutTime` in
 *   app/src/redux/middleware/realtimeTransport/realtime.js:23), so keep it
 *   well under that.
 * idleTimeoutMS: how long a connection may go without any request from its
 *   client (heartbeat, edit) before the server closes it. Browsers throttle
 *   timers in background tabs to about one a minute, while the client
 *   heartbeats every 20s (`heartbeatMS` in
 *   app/src/redux/middleware/realtimeTransport/sse.js:91), so use 60s or more.
 * revalidateMS: how often an open connection's credential expiry and the user's
 *   access to the model are checked again; the connection is closed on failure.
 * maxConnectionsPerUser: how many streams one user may have open on one model;
 *   opening another closes the user's oldest.
 */
export const defaultSseSettings = {
  keepAliveMS: 5000,
  idleTimeoutMS: 120000,
  maxConnectionsPerUser: 5,
  revalidateMS: 30000,
};

export type SseSettings = typeof defaultSseSettings;

/**
 * The default settings, with whatever the config files set on top.
 */
export function getSseSettings(): SseSettings {
  return { ...defaultSseSettings, ...config.realtimeTransport?.sse };
}

// When each open connection last heard from its client.
const lastSeen = new WeakMap<RoomConnection, number>();

/**
 * Routes for the SSE transport, mounted on /models/:modelId/events behind the
 * regular authentication middleware.
 *
 * GET /               opens the event stream
 * POST /:connectionId submits an edit from the client that owns the stream
 * POST /:connectionId/heartbeat
 *                     tells the server the client is still there; a connection
 *                     that stays silent is closed by the server
 * DELETE /:connectionId closes the stream; sent by a client that is leaving, as
 *                     a proxy may not pass its disconnect on to the server
 */
export function sseRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });

  router.get("/", openStream(dal));
  router.post("/:connectionId", submitEdit());
  router.post("/:connectionId/heartbeat", heartbeat());
  router.delete("/:connectionId", leaveStream());

  return router;
}

function openStream(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = routeParams(req.params);

    const model = await dal.modelService.getById(modelId);
    if (!model) {
      throw new NotFoundError();
    }

    const user = req.user;
    const permissions = await _permissionsInterface.getPermissions(
      { currentRequest: req as any },
      model,
      user
    );
    if (!permissions.includes(Permission.Read)) {
      throw new AuthzError("Not authorized to read model");
    }

    // The stream is long lived: no socket timeout, and no buffering.
    req.socket.setTimeout(0);
    req.socket.setNoDelay(true);
    req.socket.setKeepAlive(true);
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    // no-transform stops compressing proxies (e.g. the dev server) from buffering
    // the stream, which would hold back events until the buffer fills.
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let room = roomRegistry.get(modelId);
    if (!room) {
      room = new ModelRoom(model, dal);
      roomRegistry.set(modelId, room);
    }

    const connection: RoomConnection = {
      id: randomUUID(),
      user,
      permissions,
      expiresAt: bearerTokenExpiry(req),
      send: (message) => {
        res.write(`data: ${message}\n\n`);
      },
      isOpen: () => !res.writableEnded && !res.destroyed,
      close: () => {
        res.end();
      },
    };

    const settings = getSseSettings();
    const own = room.connections.filter(
      (c) => c.user.sub === user.sub && c.isOpen()
    );
    own
      .slice(0, Math.max(0, own.length - settings.maxConnectionsPerUser + 1))
      .forEach((c) => c.close?.());

    res.write(
      `event: connected\ndata: ${JSON.stringify({
        connectionId: connection.id,
      })}\n\n`
    );
    room.addConnection(connection);
    lastSeen.set(connection, Date.now());

    let revalidating = false;
    const revalidate = setInterval(async () => {
      if (revalidating || !connection.isOpen()) return;
      revalidating = true;
      try {
        if (!(await room.revalidate(connection))) connection.close?.();
      } finally {
        revalidating = false;
      }
    }, settings.revalidateMS);

    const keepAlive = setInterval(() => {
      if (!connection.isOpen()) return;
      // Safety net for a client that vanished without the server noticing, e.g.
      // behind a proxy that keeps its connection to the server open.
      if (Date.now() - lastSeen.get(connection)! > settings.idleTimeoutMS) {
        connection.close?.();
        return;
      }
      res.write(": keepalive\n\n");
    }, settings.keepAliveMS);

    res.on("close", () => {
      clearInterval(keepAlive);
      clearInterval(revalidate);
      room.removeConnection(connection);
    });
  };
}

// A connection is only addressable by the user who opened it.
function findConnection(req: Request) {
  const { modelId, connectionId } = routeParams(req.params);
  const room = roomRegistry.get(modelId);
  const connection = room?.connections.find(
    (c) => c.id === connectionId && c.user.sub === req.user.sub
  );
  // Any request from the owner shows the client is still there.
  if (connection) lastSeen.set(connection, Date.now());
  return { room, connection };
}

function heartbeat() {
  return (req: Request, res: Response) => {
    const { connection } = findConnection(req);
    res.sendStatus(connection ? 204 : 404);
  };
}

function submitEdit() {
  return (req: Request, res: Response) => {
    const { room, connection } = findConnection(req);
    if (!room || !connection) {
      res.sendStatus(404);
      return;
    }

    if (
      typeof req.body !== "object" ||
      req.body === null ||
      Array.isArray(req.body)
    ) {
      res.sendStatus(400);
      return;
    }

    const result = room.handleMessage(connection, JSON.stringify(req.body));
    if (result === "unauthorized") {
      res.sendStatus(403);
    } else if (result === "too_large") {
      res.sendStatus(413);
    } else if (result === "rate_limited") {
      res.sendStatus(429);
    } else if (result === "invalid") {
      res.sendStatus(400);
    } else {
      res.sendStatus(204);
    }
  };
}

function leaveStream() {
  return (req: Request, res: Response) => {
    const { connection } = findConnection(req);
    if (!connection) {
      res.sendStatus(404);
      return;
    }

    // Ending the stream removes the connection from presence.
    connection.close?.();
    res.sendStatus(204);
  };
}

/**
 * Starts what the SSE transport needs besides its routes: notifications from
 * the services, cleanup of idle rooms and metrics.
 */
export function attachSseRealtime(dal: DataAccessLayer) {
  attachRoomNotifications(dal);
  const cleanupInterval = startRoomCleanup();
  initRealtimeMetrics("sse", roomRegistry);
  return { roomRegistry, cleanupInterval };
}

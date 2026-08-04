import { initConfig } from "@gram/config";
initConfig(); // Must do this before loading config
import { configureLogging } from "@gram/core/dist/logger/index.js";
configureLogging();

import http from "http";
import { createApp } from "./app.js";
import { createControlApp } from "./controlApp.js";
import { bootstrap } from "@gram/core/dist/bootstrap.js";
import log4js from "log4js";
import {
  notificationHandler,
  notificationRetryHandler,
} from "@gram/core/dist/notifications/handler.js";
import { attachWebsocketServer } from "./ws/index.js";
import { config } from "@gram/core/dist/config/index.js";
import { version } from "./util/version.js";

// Defaults - deployments can override any of these via
// config.notifications.intervals.
const DEFAULT_NOTIFICATION_INTERVAL = 1000 * 30; // every 30 seconds
const DEFAULT_NOTIFICATION_RETRY_INTERVAL = 1000 * 60; // every minute
const DEFAULT_NOTIFICATION_RETENTION_INTERVAL = 1000 * 60 * 60 * 24 * 7; // weekly
const DEFAULT_NOTIFICATION_RETENTION_WINDOW = 1000 * 60 * 60 * 24 * 30; // one month

const log = log4js.getLogger("api");

// Catch and log unhandled errors
const handleUnhandledError = (err: Error) => {
  log.fatal("unhandled error occured", err);
};
process.on("unhandledRejection", handleUnhandledError);
process.on("uncaughtException", handleUnhandledError);

const listen = async () => {
  log.info(`Starting gram@${version}`);
  const dal = await bootstrap();

  const intervals = config.notifications.intervals;
  const NOTIFICATION_INTERVAL =
    intervals?.notificationInterval ?? DEFAULT_NOTIFICATION_INTERVAL;
  const NOTIFICATION_RETRY_INTERVAL =
    intervals?.notificationRetryInterval ?? DEFAULT_NOTIFICATION_RETRY_INTERVAL;
  const NOTIFICATION_RETENTION_INTERVAL =
    intervals?.notificationRetentionInterval ??
    DEFAULT_NOTIFICATION_RETENTION_INTERVAL;
  const NOTIFICATION_RETENTION_WINDOW =
    intervals?.notificationRetentionWindow ??
    DEFAULT_NOTIFICATION_RETENTION_WINDOW;

  // Create Express Apps
  const app = await createApp(dal);
  const controlApp = createControlApp(dal);

  // Bootstrap packs with custom functionality / addons

  // Set up HTTP servers and start listening
  const appPort = config.appPort;
  const appServer = http.createServer(app);
  // Attach websocket handler
  attachWebsocketServer(appServer, dal);
  appServer.listen(appPort);
  log.info(`appServer - listening to ${appPort}`);

  const controlPort = config.controlPort;
  const controlServer = http.createServer(controlApp);
  controlServer.listen(controlPort);
  log.info(`controlServer - listening to ${controlPort}`);

  // Set up async processes (notification handler)
  setInterval(
    () =>
      notificationHandler(dal.notificationService, dal.notificationProviders),
    NOTIFICATION_INTERVAL,
  );
  // Retry previously-failed notifications every minute - no attempt limit or
  // backoff, every currently-failed row gets another shot on every run.
  setInterval(
    () =>
      notificationRetryHandler(
        dal.notificationService,
        dal.notificationProviders,
      ),
    NOTIFICATION_RETRY_INTERVAL,
  );
  setInterval(() => dal.validationEngine.cache.expire(), 10 * 60 * 1000); // Clean up the Validation cache every 10 minutes
  // Delete notification rows older than one month, regardless of status - a
  // retention backstop, not a substitute for the failed/stalled health checks.
  setInterval(
    () =>
      dal.notificationService.deleteOlderThan(
        new Date(Date.now() - NOTIFICATION_RETENTION_WINDOW),
      ),
    NOTIFICATION_RETENTION_INTERVAL,
  );
};

listen();

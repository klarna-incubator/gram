// This allows TypeScript to detect our global value
// Sentry needs this: https://docs.sentry.io/platforms/node/typescript/
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}

global.__rootdir__ = __dirname || process.cwd();
// End of Sentry stuff

import { initConfig } from "@gram/config";
initConfig(); // Must do this before loading config
import { configureLogging } from "@gram/core/dist/logger";
configureLogging();

import http from "http";
import { createApp } from "./app";
import { createControlApp } from "./controlApp";
import { bootstrap } from "@gram/core/dist/bootstrap";
import { getLogger } from "log4js";
import { notificationSender } from "@gram/core/dist/notifications/sender";
// import { bootstrapPlugins } from "./bootstrap";
import { attachWebsocketServer } from "./ws";
import { config } from "@gram/core/dist/config";

const NOTIFICATION_INTERVAL = 1000 * 30; // 30 seconds

const log = getLogger("api");

// Catch and log unhandled errors
const handleUnhandledError = (err: Error) => {
  log.fatal("unhandled error occured", err);
};
process.on("unhandledRejection", handleUnhandledError);
process.on("uncaughtException", handleUnhandledError);

const listen = async () => {
  log.info(`Starting gram@${process.env.npm_package_version}`);
  const dal = await bootstrap();

  // Create Express Apps
  const app = await createApp(dal);
  const controlApp = createControlApp(dal);

  // Bootstrap packs with custom functionality / addons

  // Set up HTTP servers and start listening
  const appPort = config.appPort;
  const appServer = http.createServer(app);
  // Attach websocket handler
  attachWebsocketServer(appServer, dal);
  await appServer.listen(appPort);
  log.info(`appServer - listening to ${appPort}`);

  const controlPort = config.controlPort;
  const controlServer = http.createServer(controlApp);
  await controlServer.listen(controlPort);
  log.info(`controlServer - listening to ${controlPort}`);

  // Set up async processes (notification sender)
  setInterval(
    () => notificationSender(dal.notificationService, dal.templateHandler),
    NOTIFICATION_INTERVAL
  );
};

listen();

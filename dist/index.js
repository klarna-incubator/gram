"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
global.__rootdir__ = __dirname || process.cwd();
// End of Sentry stuff
const config_1 = __importDefault(require("config"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const controlApp_1 = require("./controlApp");
const postgres_1 = require("@gram/core/dist/data/postgres");
const logger_1 = require("@gram/core/dist/logger");
const sender_1 = require("@gram/core/dist/notifications/sender");
const bootstrap_1 = require("./bootstrap");
const ws_1 = require("./ws");
const NOTIFICATION_INTERVAL = 1000 * 30; // 30 seconds
const log = (0, logger_1.getLogger)("api");
// Catch and log unhandled errors
const handleUnhandledError = (err) => {
    log.fatal("unhandled error occured", err);
};
process.on("unhandledRejection", handleUnhandledError);
process.on("uncaughtException", handleUnhandledError);
const listen = () => __awaiter(void 0, void 0, void 0, function* () {
    log.info(`Starting gram@${process.env.npm_package_version}`);
    const pool = yield (0, postgres_1.createPostgresPool)();
    log.info("postgres connection established");
    // Create Express Apps
    const { app, dal } = yield (0, app_1.default)(pool);
    const controlApp = (0, controlApp_1.createControlApp)(dal);
    // Bootstrap packs with custom functionality / addons
    yield (0, bootstrap_1.bootstrapPlugins)(app, dal);
    // Set up HTTP servers and start listening
    const appPort = config_1.default.get("appPort");
    const appServer = http_1.default.createServer(app);
    // Attach websocket handler
    (0, ws_1.attachWebsocketServer)(appServer, dal);
    yield appServer.listen(appPort);
    log.info(`appServer - listening to ${appPort}`);
    const controlPort = config_1.default.get("controlPort");
    const controlServer = http_1.default.createServer(controlApp);
    yield controlServer.listen(controlPort);
    log.info(`controlServer - listening to ${controlPort}`);
    // Set up async processes (notification sender)
    setInterval(() => (0, sender_1.notificationSender)(dal.notificationService, dal.templateHandler), NOTIFICATION_INTERVAL);
});
listen();
//# sourceMappingURL=index.js.map
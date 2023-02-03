"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.ModelWebsocketServer = void 0;
const ws_1 = __importDefault(require("ws"));
const authorization_1 = require("@gram/core/dist/auth/authorization");
const logger_1 = require("@gram/core/dist/logger");
const jwt = __importStar(require("@gram/core/dist/auth/jwt"));
class ModelWebsocketServer {
    constructor(model, dal) {
        this.VALID_TYPES = [
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
        this.pingTimeoutMS = 15000;
        this.pingIntervalMS = 5000;
        this.wsUserMap = [];
        this.authenticate = (ws) => (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { token } = JSON.parse(data);
                const user = yield jwt.validateToken(token);
                const permissions = yield (0, authorization_1.getPermissionsForModel)({}, this.model, user);
                if (!permissions.includes(authorization_1.Permission.Read)) {
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
            }
            catch (e) {
                ws.send(JSON.stringify({ msg: "authentication failed" }));
                ws.terminate();
                return false;
            }
        });
        this.validate = (sender, msg) => {
            if (!this.VALID_TYPES.includes(msg.type)) {
                sender.send(JSON.stringify({
                    type: "WS_ERROR",
                    message: `Invalid type ${msg.type}`,
                }));
                this.log.warn(`received invalid websocket packet: ${msg.type}`);
                return false;
            }
            return true;
        };
        this.checkPermission = (sender, perm) => {
            const tuple = this.wsUserMap.find(({ ws }) => ws === sender);
            if (!(tuple === null || tuple === void 0 ? void 0 : tuple.permissions.includes(perm))) {
                sender.send(JSON.stringify({
                    type: "WS_UNAUTHORIZED",
                    message: `You're not authorized to ${perm}`,
                }));
                this.log.warn(`unauthorized ${perm} to ws was attempted by: ${tuple === null || tuple === void 0 ? void 0 : tuple.user.sub}`);
                return false;
            }
            return true;
        };
        this.onTimeout = (timedoutWs) => {
            const tuple = this.wsUserMap.find(({ ws }) => ws === timedoutWs);
            this.log.info(`Socket for ${tuple === null || tuple === void 0 ? void 0 : tuple.user.sub} timed out`);
            // Use `WebSocket#terminate()`, which immediately destroys the connection,
            // instead of `WebSocket#close()`, which waits for the close timer.
            timedoutWs.terminate();
        };
        this.onClose = (sender, skipPublish) => {
            this.wsUserMap = this.wsUserMap.filter(({ ws }) => ws !== sender);
            if (!skipPublish)
                this.publishUserList();
        };
        this.onMessage = (sender, user) => (data) => {
            this.log.info(`${this.id} Received message ${data} from user ${user.sub}`);
            if (!this.checkPermission(sender, authorization_1.Permission.Write)) {
                return;
            }
            const original = JSON.parse(data);
            if (!this.validate(sender, original)) {
                return;
            }
            const msg = Object.assign(Object.assign({}, original), { from: {
                    sub: user.sub,
                    name: user.name,
                    picture: user.picture,
                } });
            this.broadcast(sender, msg);
        };
        this.id = model.id;
        this.model = model;
        this.dal = dal;
        this.server = new ws_1.default.Server({ noServer: true });
        this.log = (0, logger_1.getLogger)(`ModelWebsocketServer [${this.id}]`);
        this.bind();
    }
    get activeUsers() {
        return Array.from(new Set(this.wsUserMap
            .filter(({ ws }) => ws.readyState === ws_1.default.OPEN)
            .map(({ user }) => ({
            sub: user.sub,
            name: user.name,
            picture: user.picture,
        }))).keys());
    }
    tellClientsToRefetch(what, args) {
        this.broadcast(null, { type: "REFETCH_RESOURCE", what, args });
    }
    broadcast(sender, msg) {
        this.wsUserMap.forEach(({ ws, permissions }) => {
            if (ws !== sender &&
                ws.readyState === ws_1.default.OPEN &&
                permissions.includes(authorization_1.Permission.Read)) {
                ws.send(JSON.stringify(msg));
            }
        });
    }
    sendPing(ws) {
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
        this.server.on("connection", (ws) => __awaiter(this, void 0, void 0, function* () {
            // if (!(await this.acceptNewUserConnection(ws, request))) {
            //   return;
            // }
            ws.on("message", this.authenticate(ws));
            let timeout = setTimeout(() => this.onTimeout(ws), this.pingTimeoutMS);
            const pingInterval = setInterval(() => {
                this.sendPing(ws);
            }, this.pingIntervalMS);
            ws.on("close", (ws) => {
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
        }));
    }
}
exports.ModelWebsocketServer = ModelWebsocketServer;
//# sourceMappingURL=model.js.map
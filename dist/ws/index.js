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
exports.attachWebsocketServer = void 0;
const config_1 = __importDefault(require("config"));
const url_1 = __importDefault(require("url"));
const ws_1 = __importDefault(require("ws"));
const logger_1 = require("@gram/core/dist/logger");
const model_1 = require("./model");
const log = (0, logger_1.getLogger)("wss");
const wssRegistry = new Map();
function validateRequestOrigin(request) {
    let origin = (request.headers.origin || "").trim();
    if (origin.endsWith("/") && origin.length > 1) {
        origin = origin.substring(0, origin.length - 1);
    }
    const corsOrigin = config_1.default.get("origin");
    let validOrigin = false;
    if (Array.isArray(corsOrigin)) {
        validOrigin = corsOrigin.includes(origin);
    }
    else {
        validOrigin = corsOrigin === origin;
    }
    if (!validOrigin)
        throw new Error("Invalid request origin");
}
function attachWebsocketServer(server, dal) {
    server.on("upgrade", function upgrade(request, socket, head) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!request.url) {
                socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
                socket.destroy();
                return;
            }
            try {
                validateRequestOrigin(request);
            }
            catch (error) {
                log.warn("Unauthorized websocket connection", error);
                socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                socket.destroy();
                return;
            }
            // /ws/model/<id>
            const pathname = url_1.default.parse(request.url).pathname;
            if (!pathname)
                return;
            const parts = pathname.split("/");
            const id = parts.length > 3 ? parts[3] : "invalid";
            const model = yield dal.modelService.getById(id);
            if (!model) {
                log.warn("Websocket upgrade attempted for invalid model id", id);
                socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
                socket.destroy();
                return;
            }
            if (!wssRegistry.has(id)) {
                log.info(`opened new websocket server for diagram with id ${id}`);
                wssRegistry.set(id, new model_1.ModelWebsocketServer(model, dal));
            }
            const wss = wssRegistry.get(id);
            wss.server.handleUpgrade(request, socket, head, function done(client) {
                wss.server.emit("connection", client, request);
            });
        });
    });
    log.info("websocket handler attached");
    dal.controlService.on("updated-for", ({ modelId, componentId }) => {
        const server = wssRegistry.get(modelId);
        log.debug(`controls was updated via api ${modelId} ${componentId}`);
        if (!server)
            return;
        server.tellClientsToRefetch("controls", { modelId, componentId });
    });
    dal.controlService.on("deleted-for", ({ modelId, componentId }) => {
        const server = wssRegistry.get(modelId);
        log.debug(`control was deleted via api ${modelId} ${componentId}`);
        if (!server)
            return;
        server.tellClientsToRefetch("controls", { modelId, componentId });
        server.tellClientsToRefetch("mitigations", { modelId, componentId });
    });
    dal.threatService.on("updated-for", ({ modelId, componentId }) => {
        const server = wssRegistry.get(modelId);
        log.debug(`threats was updated via api ${modelId} ${componentId}`);
        if (!server)
            return;
        server.tellClientsToRefetch("threats", { modelId, componentId });
    });
    dal.threatService.on("deleted-for", ({ modelId, componentId }) => {
        const server = wssRegistry.get(modelId);
        log.debug(`threat was deleted via api ${modelId} ${componentId}`);
        if (!server)
            return;
        server.tellClientsToRefetch("threats", { modelId, componentId });
        server.tellClientsToRefetch("mitigations", { modelId, componentId });
    });
    dal.mitigationService.on("updated-for", ({ modelId, componentId }) => {
        const server = wssRegistry.get(modelId);
        log.debug(`mitigations was updated via api ${modelId} ${componentId}`);
        if (!server)
            return;
        server.tellClientsToRefetch("mitigations", { modelId, componentId });
    });
    dal.reviewService.on("updated-for", ({ modelId }) => {
        const server = wssRegistry.get(modelId);
        log.debug(`review was updated via api ${modelId}`);
        if (!server)
            return;
        server.tellClientsToRefetch("review", { modelId });
    });
    dal.suggestionService.on("updated-for", ({ modelId }) => {
        const server = wssRegistry.get(modelId);
        log.debug(`suggestions was updated for ${modelId}`);
        if (!server)
            return;
        server.tellClientsToRefetch("suggestions", { modelId });
    });
    // Clean up leftover websocket servers
    const cleanupInterval = setInterval(() => {
        log.debug(`Number active channels: ${wssRegistry.size}`);
        wssRegistry.forEach((wss, k) => {
            const numConnectedClients = Array.from(wss.server.clients).filter((c) => c.readyState === ws_1.default.OPEN).length;
            log.debug(`Channel ${k} has ${numConnectedClients} connected`);
            if (numConnectedClients === 0) {
                const server = wssRegistry.get(k);
                server === null || server === void 0 ? void 0 : server.server.close();
                wssRegistry.delete(k);
            }
        });
    }, 30000);
    return { wssRegistry, cleanupInterval };
}
exports.attachWebsocketServer = attachWebsocketServer;
//# sourceMappingURL=index.js.map
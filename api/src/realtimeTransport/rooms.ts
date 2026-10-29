import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import log4js from "log4js";
import { ModelRoom } from "./ModelRoom.js";

const log = log4js.getLogger("rooms");

/**
 * The active rooms by model id. Shared by whichever real-time transport is
 * configured.
 */
export const roomRegistry = new Map<string, ModelRoom>();

/**
 * Forwards changes made through the API to the clients of the affected model's
 * room, so they refetch the resource.
 */
export function attachRoomNotifications(dal: DataAccessLayer) {
  dal.validationEngine.on("updated-for", ({ modelId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`validation for ${modelId} was updated`);
    if (!server) return;
    server.tellClientsToRefetch("validation", { modelId });
  });

  dal.controlService.on("updated-for", ({ modelId, componentId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`controls was updated via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("controls", { modelId, componentId });
  });

  dal.controlService.on("deleted-for", ({ modelId, componentId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`control was deleted via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("controls", { modelId, componentId });
    server.tellClientsToRefetch("mitigations", { modelId, componentId });
  });

  dal.threatService.on("updated-for", ({ modelId, componentId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`threats was updated via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("threats", { modelId, componentId });
  });

  dal.threatService.on("deleted-for", ({ modelId, componentId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`threat was deleted via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("threats", { modelId, componentId });
    server.tellClientsToRefetch("mitigations", { modelId, componentId });
  });

  dal.mitigationService.on("updated-for", ({ modelId, componentId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`mitigations was updated via api ${modelId} ${componentId}`);
    if (!server) return;
    server.tellClientsToRefetch("mitigations", { modelId, componentId });
  });

  dal.reviewService.on("updated-for", ({ modelId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`review was updated via api ${modelId}`);
    if (!server) return;
    server.tellClientsToRefetch("review", { modelId });
  });

  dal.suggestionService.on("updated-for", ({ modelId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`suggestions was updated for ${modelId}`);
    if (!server) return;
    server.tellClientsToRefetch("suggestions", { modelId });
  });

  dal.linkService.on("updated-for", ({ modelId, objectType, objectId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`links was updated for ${objectType} ${objectId}`);
    if (!server) return;
    server.tellClientsToRefetch("links", { objectType, objectId });
  });

  dal.flowService.on("updated-for", ({ modelId, dataFlowId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`flows was updated for ${modelId} ${dataFlowId}`);
    if (!server) return;
    server.tellClientsToRefetch("flows", { modelId, dataFlowId });
  });

  dal.resourceMatchingService.on("updated-for", ({ modelId }) => {
    const server = roomRegistry.get(modelId);
    log.debug(`resource-matching was updated for ${modelId}`);
    if (!server) return;
    server.tellClientsToRefetch("resource-matchings", { modelId });
  });
}

/**
 * Drops rooms that no longer have any connected clients.
 */
export function startRoomCleanup(intervalMS = 30000) {
  return setInterval(() => {
    log.debug(`Number active channels: ${roomRegistry.size}`);
    roomRegistry.forEach((room, k) => {
      const numConnectedClients = room.openConnectionCount();

      log.debug(`Channel ${k} has ${numConnectedClients} connected`);

      if (numConnectedClients === 0) {
        room.close();
        roomRegistry.delete(k);
      }
    });
  }, intervalMS);
}

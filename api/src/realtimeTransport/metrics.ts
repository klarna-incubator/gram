import metricsClient from "prom-client";
import { ModelRoom } from "./ModelRoom.js";

let metricsInited = false;
export function initRealtimeMetrics(
  transport: "websocket" | "sse",
  roomRegistry: Map<string, ModelRoom>
) {
  if (metricsInited) {
    return;
  }
  metricsInited = true;

  new metricsClient.Gauge({
    name: `${transport}_active_models`,
    help: `The number of threat models which have active ${transport} connections.`,
    collect() {
      this.set(roomRegistry.size);
    },
  });

  new metricsClient.Gauge({
    name: `${transport}_active_clients`,
    help: `The number of clients which have active ${transport} connections.`,
    collect() {
      let activeUsersCount = 0;
      roomRegistry.forEach((room) => {
        activeUsersCount += room.activeUsers.length;
      });
      this.set(activeUsersCount);
    },
  });

  new metricsClient.Gauge({
    name: `${transport}_unique_users`,
    help: `The number of unique users with active ${transport} connections.`,
    collect() {
      const users = new Set<string>();
      roomRegistry.forEach((room) => {
        room.activeUsers.forEach((user) => {
          users.add(user.sub);
        });
      });
      this.set(users.size);
    },
  });
}

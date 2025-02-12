import metricsClient from "prom-client";
import { ModelWebsocketServer } from "./model.js";

let metricsInited = false;
export function initWebsocketMetrics(
  wssRegistry: Map<string, ModelWebsocketServer>
) {
  if (metricsInited) {
    return;
  }
  metricsInited = true;

  new metricsClient.Gauge({
    name: "websocket_active_models",
    help: "The number of threat models which have active websocket connections.",
    collect() {
      this.set(wssRegistry.size);
    },
  });

  new metricsClient.Gauge({
    name: "websocket_active_clients",
    help: "The number of clients which have active websocket connections.",
    collect() {
      let activeUsersCount = 0;
      wssRegistry.forEach((wss) => {
        activeUsersCount += wss.activeUsers.length;
      });
      this.set(activeUsersCount);
    },
  });

  new metricsClient.Gauge({
    name: "websocket_unique_users",
    help: "The number of unique users with active websocket connections.",
    collect() {
      const users = new Set<string>();
      wssRegistry.forEach((wss) => {
        wss.activeUsers.forEach((user) => {
          users.add(user.sub);
        });
      });
      this.set(users.size);
    },
  });
}

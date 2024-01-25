import { config } from "../config/index.js";
import { HttpsProxyAgent } from "hpagent";

export function createHttpsProxyAgent() {
  if (!config.httpsProxy) {
    return undefined;
  }

  const agent = new HttpsProxyAgent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 256,
    maxFreeSockets: 256,
    scheduling: "lifo",
    proxy: config.httpsProxy,
  });
  return agent;
}

import { config } from "../config/index.js";
import { HttpsProxyAgent } from "hpagent";
import log4js from "log4js";

const log = log4js.getLogger("ProxyAgent");

export function createHttpsProxyAgent() {
  if (!config.httpsProxy) {
    return undefined;
  }

  log.info(`Creating HttpsProxyAgent with proxy ${config.httpsProxy}`);

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

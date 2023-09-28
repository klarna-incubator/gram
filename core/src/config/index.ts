import pkg from "log4js";
const { getLogger } = pkg;
import { GramConfiguration } from "./GramConfiguration.js";
import { configurationMap } from "./configMap.js";

const log = getLogger("config");

export function loadConfig() {
  let env = process.env.NODE_ENV;

  if (!env) {
    throw new Error(
      "No environment set. Use NODE_ENV=<your env> to indicate your environment."
    );
  }

  const loadedConfig = configurationMap.get(env);
  if (!loadedConfig) {
    throw new Error(`No configuration found for NODE_ENV=${env}`);
  }
  config = loadedConfig;
  log.info("Configuration loaded.");
}

let config: GramConfiguration;

export { config };

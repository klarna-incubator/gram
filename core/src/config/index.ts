import { getLogger } from "log4js";
import { GramConfiguration } from "./GramConfiguration";
import { configurationMap } from "./configMap";

const log = getLogger("config");

export function loadConfig() {
  let env = process.env.NODE_ENV;

  if (!env) {
    env = "default";
    log.warn(
      "No environment set, falling back to 'default' for configuration. Please use NODE_ENV=<your env> to indicate your environment."
    );
  }

  const loadedConfig = configurationMap.get(env);
  if (!loadedConfig) {
    throw new Error(`No configuration found for ${env}`);
  }
  config = loadedConfig;
  log.info("Configuration loaded.");
}

let config: GramConfiguration;

export { config };

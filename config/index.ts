import { registerConfiguration } from "@gram/core/dist/config/configMap";
import { loadConfig } from "@gram/core/dist/config";
import { defaultConfig } from "./default";
import { developmentConfig } from "./development";

export function initConfig() {
  registerConfiguration("default", defaultConfig);
  registerConfiguration("development", developmentConfig);
  loadConfig();
}

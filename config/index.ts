import { loadConfig } from "@gram/core/dist/config";
import { registerConfiguration } from "@gram/core/dist/config/configMap";
import { developmentConfig } from "./development";

export function initConfig() {
  registerConfiguration("development", developmentConfig);
  //   registerConfiguration("staging", stagingConfig);
  //   registerConfiguration("production", productionConfig);
  loadConfig();
}

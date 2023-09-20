import dotenv from "dotenv";
import { loadConfig } from "@gram/core/dist/config";
import { registerConfiguration } from "@gram/core/dist/config/configMap";
import { developmentConfig } from "./development";

export function initConfig() {
  dotenv.config({ path: "../.env" });
  registerConfiguration("development", developmentConfig);
  //   registerConfiguration("staging", stagingConfig);
  //   registerConfiguration("production", productionConfig);
  loadConfig();
}

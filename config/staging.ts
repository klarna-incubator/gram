import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { defaultConfig } from "./default.js";

export const stagingConfig: GramConfiguration = {
  ...defaultConfig,

  // Update this to your domain
  origin: "http://localhost:4726",
};

import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration";
import { defaultConfig } from "./default";

export const productionConfig: GramConfiguration = {
  ...defaultConfig,

  // Update this to your domain
  origin: "http://localhost:4726",
};

import { GramConfiguration } from "./GramConfiguration.js";

export const configurationMap: Map<string, GramConfiguration> = new Map();

export function registerConfiguration(env: string, config: GramConfiguration) {
  configurationMap.set(env, config);
}

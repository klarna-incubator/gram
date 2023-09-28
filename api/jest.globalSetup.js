import { loadConfig } from "@gram/core/dist/config/index.js";
import { registerConfiguration } from "@gram/core/dist/config/configMap.js";
import { migrate } from "@gram/core/dist/data/Migration.js";
import { testConfig } from "./dist/test-util/testConfig.js";

export default async function setup() {
  registerConfiguration("test", testConfig);
  loadConfig();
  await migrate();
}

import { loadConfig } from "./dist/config/index.js";
import { registerConfiguration } from "./dist/config/configMap.js";
import { migrate } from "./dist/data/Migration.js";
import { testConfig } from "./dist/test-util/testConfig.js";

export default async function setup() {
  registerConfiguration("test", testConfig);
  loadConfig();
  await migrate();
}

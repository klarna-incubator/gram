import { loadConfig } from "./src/config";
import { registerConfiguration } from "./src/config/configMap";
import { migrate } from "./src/data/Migration";
import { testConfig } from "./src/test-util/testConfig";

export default async function setup() {
  registerConfiguration("test", testConfig);
  loadConfig();
  await migrate();
}

import { loadConfig } from "@gram/core/dist/config";
import { registerConfiguration } from "@gram/core/dist/config/configMap";
import { migrate } from "@gram/core/dist/data/Migration";
import { testConfig } from "./src/test-util/testConfig";

export default async function setup() {
  registerConfiguration("test", testConfig);
  loadConfig();
  await migrate();
}

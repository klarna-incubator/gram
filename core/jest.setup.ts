import { jest } from "@jest/globals";
import { loadConfig } from "./src/config/index.js";
import { registerConfiguration } from "./src/config/configMap.js";
import { testConfig } from "./src/test-util/testConfig.js";

jest.setTimeout(30000);
registerConfiguration("test", testConfig);
loadConfig();

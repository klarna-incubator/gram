import { jest } from "@jest/globals";
import { loadConfig } from "@gram/core/dist/config/index.js";
import { registerConfiguration } from "@gram/core/dist/config/configMap.js";
import { testConfig } from "./src/test-util/testConfig.js";

jest.setTimeout(30000);
registerConfiguration("test", testConfig);
loadConfig();

import { loadConfig } from "@gram/core/dist/config";
import { registerConfiguration } from "@gram/core/dist/config/configMap";
import { testConfig } from "./src/test-util/testConfig";

jest.setTimeout(30000);
registerConfiguration("test", testConfig);
loadConfig();

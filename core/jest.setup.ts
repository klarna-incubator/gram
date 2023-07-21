import { loadConfig } from "./src/config";
import { registerConfiguration } from "./src/config/configMap";
import { testConfig } from "./src/test-util/testConfig";

jest.setTimeout(30000);
registerConfiguration("test", testConfig);
loadConfig();

import { loadConfig } from "./dist/config/index.js";
import { registerConfiguration } from "./dist/config/configMap.js";
import { migrate } from "./dist/data/Migration.js";
import { testConfig } from "./dist/test-util/testConfig.js";
import { DataAccessLayer } from "./dist/data/dal.js";
import { createPostgresPool } from "./dist/data/postgres.js";

export default async function setup() {
  registerConfiguration("test", testConfig);
  loadConfig();
  const pool = await createPostgresPool();
  const dal = new DataAccessLayer(pool);  
  await migrate(dal);
}

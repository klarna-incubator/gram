import { loadConfig } from "@gram/core/dist/config/index.js";
import { registerConfiguration } from "@gram/core/dist/config/configMap.js";
import { migrate } from "@gram/core/dist/data/Migration.js";
import { testConfig } from "./dist/test-util/testConfig.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createPostgresPool } from "@gram/core/dist/data/postgres.js";

export default async function setup() {
  registerConfiguration("test", testConfig);
  loadConfig();
  const pool = await createPostgresPool();
  const dal = new DataAccessLayer(pool);  
  await migrate(dal);
}
import log4js from "log4js";
import * as url from "url";
import {
  MigrateDBConfig,
  migrate as postgresMigrate,
} from "postgres-migrations";
import { config } from "../config/index.js";
import { getDatabaseName } from "./postgres.js";
import { DataAccessLayer } from "./dal.js";
import { runCreateQuery } from "postgres-migrations/dist/create.js";
import { Pool } from "pg";

const log = log4js.getLogger("Migration");

export class Migration {
  constructor(public folderPath: string, public pluginSuffix: string) {}

  async ensureDbExists(pool: Pool, databaseName: string) {
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname=$1",
      [databaseName]
    );
    if (result.rowCount !== 1) {
      await runCreateQuery(databaseName, (msg: string) => log.debug(msg))(pool);
    }
  }

  async migrate(dal: DataAccessLayer) {
    const host = await config.postgres.host.getValue();
    const databaseName = await getDatabaseName(this.pluginSuffix);
    const pool = this.pluginSuffix
      ? await dal.pluginPool(this.pluginSuffix)
      : dal.pool._pool;

    log.info(
      `Starting migration for ${process.env.NODE_ENV} (${host} - ${databaseName})`
    );

    await this.ensureDbExists(pool, databaseName);

    const migrationConfig: MigrateDBConfig = { client: pool };

    const migs = await postgresMigrate(migrationConfig, this.folderPath);
    migs.forEach((mig) => {
      log.info(`Ran migration: ${mig.name}`);
    });

    log.info("Successfully ran the migration");
  }
}

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const coreMigration = new Migration(
  __dirname.includes("/dist/")
    ? __dirname + "/../../src/data/migrations"
    : __dirname + "/migrations",
  ""
);

export async function migrate(dal: DataAccessLayer) {
  // Perform migrations
  const migrations = [coreMigration, ...(config.additionalMigrations || [])];
  for (const mig of migrations) {
    await mig.migrate(dal);
  }
}

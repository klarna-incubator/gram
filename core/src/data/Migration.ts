import log4js from "log4js";
import * as url from "url";
import {
  MigrateDBConfig,
  migrate as postgresMigrate,
} from "postgres-migrations";
import { config } from "../config/index.js";
import { getDatabaseName } from "./postgres.js";

const log = log4js.getLogger("Migration");

export class Migration {
  constructor(public folderPath: string, public pluginSuffix: string) {}

  async migrate() {
    const host = await config.postgres.host.getValue();
    const databaseName = await getDatabaseName(this.pluginSuffix);

    log.info(
      `Starting migration for ${process.env.NODE_ENV} (${host} - ${databaseName})`
    );

    const migrationConfig: MigrateDBConfig = {
      database: databaseName,
      port: parseInt((await config.postgres.port.getValue()) || "5432"),
      host: (await config.postgres.host.getValue()) as string,
      user: (await config.postgres.user.getValue()) as string,
      password: (await config.postgres.password.getValue()) as string,
      ensureDatabaseExists: true,
    };

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

export async function migrate() {
  // Perform migrations
  const migrations = [coreMigration, ...(config.additionalMigrations || [])];
  for (const mig of migrations) {
    await mig.migrate();
  }
}

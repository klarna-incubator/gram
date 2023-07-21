import { createDb, migrate as postgresMigrate } from "postgres-migrations";
import {
  createPostgresPool,
  getDatabaseName,
  GramConnectionPool,
} from "./postgres";
import { getLogger } from "log4js";
import { config } from "../config";

const log = getLogger("Migration");

export class Migration {
  constructor(public folderPath: string, public pluginSuffix: string) {}

  async migrate() {
    const host = await config.postgres.host.getValue();
    const databaseName = await getDatabaseName(this.pluginSuffix);

    log.info(
      `Starting migration for ${process.env.NODE_ENV} (${host} - ${databaseName})`
    );

    const pool = new GramConnectionPool(
      await createPostgresPool({ database: databaseName })
    );

    await createDb(databaseName, { client: pool._pool });
    log.info("Created DB (if not exist): " + databaseName);

    const migs = await postgresMigrate({ client: pool._pool }, this.folderPath);
    migs.forEach((mig) => {
      log.info(`Ran migration: ${mig.name}`);
    });

    log.info("Successfully ran the migration");
  }
}

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

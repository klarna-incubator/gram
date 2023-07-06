import { Pool } from "pg";
import { createDb, migrate } from "postgres-migrations";
import { createPostgresPool } from "../data/postgres";
import { getLogger } from "../logger";
import secrets from "../secrets";

export async function getDatabaseName(suffix: string) {
  const regularDatabase = (await secrets.get(
    "data._providers.postgres.database"
  )) as string;
  const databaseName = regularDatabase + "-" + suffix;
  return databaseName;
}

export async function migratePlugin(
  pluginSuffix: string,
  migrationsFolder: string
) {
  if (pluginSuffix.trim().length === 0) {
    throw new Error("Plugin suffix must be provided");
  }

  const log = getLogger("migrate-" + pluginSuffix);

  const databaseName = await getDatabaseName(pluginSuffix);
  const host = (await secrets.get("data._providers.postgres.host")) as string;

  log.info(
    `Starting migration for ${process.env.NODE_ENV} (${host} - ${databaseName})`
  );

  let pool = await createPostgresPool(); // Connect to default DB
  await createDb(databaseName, { client: pool }); // Create a new DB, otherwise this will conflict with normal migrations
  log.info("Created DB (if not exist): " + databaseName);

  pool = await createPostgresPool({ database: databaseName });
  const migs = await migrate({ client: pool }, migrationsFolder);
  migs.forEach((mig) => {
    log.info(`Ran migration: ${mig.name}`);
  });
  log.info("Successfully ran all migrations");
}

export async function getPool(pluginDbSuffix: string): Promise<Pool> {
  const databaseName = await getDatabaseName(pluginDbSuffix);
  const pool = await createPostgresPool({ database: databaseName });
  return pool;
}

import { createDb, migrate } from "postgres-migrations";
import { createPostgresPool } from "@gram/core/dist/data/postgres.js";
import log4js from "log4js";
import { config } from "@gram/core/src/config/index.js";

export async function getDatabaseName() {
  const regularDatabase = (await config.postgres.database.getValue()) as string;
  const databaseName = regularDatabase + "_github";
  return databaseName;
}

export async function additionalMigrations() {
  const log = log4js.getLogger("gh-migrate");

  const databaseName = await getDatabaseName();
  const host = (await config.postgres.host.getValue()) as string;

  log.info(
    `Starting migration for ${process.env.NODE_ENV} (${host} - ${databaseName})`
  );

  let pool = await createPostgresPool(); // Connect to default DB
  await createDb(databaseName, { client: pool }); // Create a new DB, otherwise this will conflict with normal migrations
  log.info("Created DB (if not exist): " + databaseName);

  pool = await createPostgresPool({ database: databaseName });
  const migs = await migrate({ client: pool }, "src/packs/github/migrations");
  migs.forEach((mig) => {
    log.info(`Ran migration: ${mig.name}`);
  });
  log.info("Successfully ran all migrations");
}

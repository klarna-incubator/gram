import { createDb, migrate } from "postgres-migrations";
import { createPostgresPool } from "../../data/postgres";
import { getLogger } from "../../logger";
import secrets from "../../secrets";

export async function getDatabaseName() {
  const regularDatabase = (await secrets.get(
    "data._providers.postgres.database"
  )) as string;
  const databaseName = regularDatabase + "_github";
  return databaseName;
}

export async function additionalMigrations() {
  const log = getLogger("gh-migrate");

  const databaseName = await getDatabaseName();
  const host = (await secrets.get("data._providers.postgres.host")) as string;

  log.info(
    `Starting migration for ${process.env.NODE_ENV} (${host} - ${databaseName})`
  );

  let pool = await createPostgresPool(); // Connect to default DB
  await createDb(databaseName, { client: pool }); // Create a new DB, otherwise this will conflict with normal migrations
  log.info("Created DB (if not exist): " + databaseName);

  pool = await createPostgresPool({ database: databaseName });
  const migs = await migrate({ client: pool }, "src/packs/demo/migrations");
  migs.forEach((mig) => {
    log.info(`Ran migration: ${mig.name}`);
  });
  log.info("Successfully ran all migrations");
}

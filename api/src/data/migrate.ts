// This file runs migrations for the Gram API. Be careful when modifying it.

import { createDb, migrate } from "postgres-migrations";
import { createPostgresPool, GramConnectionPool } from "./postgres";
import { getLogger } from "../logger";
import secrets from "../secrets";
import { sys } from "typescript";

async function main() {
  const log = getLogger("migrate");

  if (!process.env.NODE_ENV) {
    log.error(
      "Please specify which environment should be migrated via the environment variable NODE_ENV"
    );
    return sys.exit(1);
  }

  const databaseName = (await secrets.get(
    "data._providers.postgres.database"
  )) as string;
  const host = (await secrets.get("data._providers.postgres.host")) as string;

  log.info(
    `Starting migration for ${process.env.NODE_ENV} (${host} - ${databaseName})`
  );

  const pool = new GramConnectionPool(await createPostgresPool());

  await createDb(databaseName, { client: pool._pool });
  log.info("Created DB (if not exist): " + databaseName);

  const migs = await migrate({ client: pool._pool }, "src/data/migrations");
  migs.forEach((mig) => {
    log.info(`Ran migration: ${mig.name}`);
  });
  log.info("Successfully ran all migrations");
}

main();

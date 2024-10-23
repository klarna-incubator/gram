import { createApp } from "../app.js";
import { bootstrap } from "@gram/core/dist/bootstrap.js";
import { Pool } from "pg";

export async function createTestApp(): Promise<{
  pool: Pool;
  app: any;
  dal: any;
}> {
  const dal = await bootstrap();
  const app = await createApp(dal);
  return { pool: dal.pool._pool, app, dal };
}

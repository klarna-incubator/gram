import { createApp } from "../app.js";
import { bootstrap } from "@gram/core/dist/bootstrap.js";

export async function createTestApp() {
  const dal = await bootstrap();
  const app = await createApp(dal);
  return { pool: dal.pool, app, dal };
}

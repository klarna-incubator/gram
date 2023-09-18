import { createApp } from "../app";
import { bootstrap } from "@gram/core/dist/bootstrap";

export async function createTestApp() {
  const dal = await bootstrap();
  const app = await createApp(dal);
  return { pool: dal.pool, app, dal };
}

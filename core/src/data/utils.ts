import { Pool } from "pg";
import { getLogger } from "../logger";

const log = getLogger("UtilsDataService");

export async function _deleteAllTheThings(pool: Pool) {
  if (process.env.NODE_ENV !== "test") {
    log.warn("Attempted to _deleteAllTheThings in a non-test environment.");
    return;
  }
  await pool.query("TRUNCATE TABLE mitigations CASCADE");
  await pool.query("TRUNCATE TABLE controls CASCADE");
  await pool.query("TRUNCATE TABLE threats CASCADE");
  await pool.query("TRUNCATE TABLE reviews CASCADE");
  await pool.query("TRUNCATE TABLE user_activity CASCADE");
  await pool.query("TRUNCATE TABLE notifications CASCADE");
  await pool.query("TRUNCATE TABLE suggested_controls CASCADE");
  await pool.query("TRUNCATE TABLE suggested_threats CASCADE");
  await pool.query("DELETE FROM models");
}
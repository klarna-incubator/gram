import pg from "pg";
import log4js from "log4js";
import { GramConnectionPool } from "./postgres.js";
import { DataAccessLayer } from "./dal.js";

const log = log4js.getLogger("UtilsDataService");

export async function _deleteAllTheThings(
  pool: pg.Pool | GramConnectionPool | DataAccessLayer
) {
  if (process.env.NODE_ENV !== "test") {
    log.warn("Attempted to _deleteAllTheThings in a non-test environment.");
    return;
  }
  if (pool instanceof DataAccessLayer) {
    pool = pool.pool._pool; // hehehe
  }
  if (pool instanceof GramConnectionPool) {
    pool = pool._pool;
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

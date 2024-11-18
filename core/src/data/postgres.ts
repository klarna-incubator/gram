import pg from "pg";
import metricsClient from "prom-client";
import log4js from "log4js";
import { config } from "../config/index.js";

const log = log4js.getLogger("postgres");

type Transaction<T> = (client: pg.PoolClient) => Promise<T>;

/**
 * Wrapper class around pg's Pool to allow us to better
 * handle clients used for transactions.
 *
 * The upstream library has an issue where if transactions time-out
 * they don't propagate correctly as an error and clients are left in a broken state
 * without the pool correctly terminating them.
 */
export class GramConnectionPool {
  _pool: pg.Pool;

  constructor(pool: pg.Pool) {
    this._pool = pool;
  }

  async query(query: string, ...args: any[]) {
    log.debug(query);
    return this._pool.query(query, ...args);
  }

  async runTransaction<T>(transaction: Transaction<T>): Promise<T> {
    const client = await this._pool.connect();

    client.on("error", (err) => {
      // This *should* catch weird timeout/disconnects that may happen
      log.error("Transaction error", err);
    });

    try {
      // Do transaction stuff
      await client.query("BEGIN");
      const result = await transaction(client);
      await client.query("COMMIT");
      return result;
    } catch (err: any) {
      log.error(`Error during postgres transaction: ${err}`);
      await client.query("ROLLBACK");
      throw err;
    } finally {
      // Ensure client is released and properly cleaned up, in case of error
      client.release(true); // true here forces the recreation of this client. This is due to an issue in node-postgres,
      // where timedout queries are not correctly handled. In practice, this meant that broken clients were getting recycled.
      // When a timeout happens, it does not get caught in the above catch-statement.
    }
  }

  end() {
    return this._pool.end();
  }
}

let metricsInited = false;
function initPostgresMetrics(pool: pg.Pool) {
  if (metricsInited) {
    return;
  }
  metricsInited = true;

  new metricsClient.Gauge({
    name: "postgres_waiting_count",
    help: "The number of queued requests waiting on a client when all clients are checked out.",
    collect() {
      this.set(pool.waitingCount);
    },
  });

  new metricsClient.Gauge({
    name: "postgres_idle_count",
    help: "The number of clients which are not checked out but are currently idle in the pool.",
    collect() {
      this.set(pool.idleCount);
    },
  });

  new metricsClient.Gauge({
    name: "postgres_total_count",
    help: "The total number of clients existing within the pool.",
    collect() {
      this.set(pool.totalCount);
    },
  });
}

export async function getDatabaseName(suffix: string) {
  const regularDatabase = (await config.postgres.database.getValue()) as string;
  const databaseName =
    suffix.length === 0 ? regularDatabase : regularDatabase + "-" + suffix;
  return databaseName;
}

export async function createPostgresPool(passedOpts?: pg.PoolConfig) {
  const defaultOpts: pg.PoolConfig = {
    max: 100,
    connectionTimeoutMillis:
      process.env.NODE_ENV && ["test"].includes(process.env.NODE_ENV)
        ? 0
        : 5000,
    idleTimeoutMillis: 1000,
  };

  defaultOpts.host = await config.postgres.host.getValue();
  defaultOpts.user = await config.postgres.user.getValue();
  defaultOpts.password = await config.postgres.password.getValue();
  defaultOpts.database = await config.postgres.database.getValue();
  defaultOpts.port = parseInt(
    (await config.postgres.port.getValue()) || "5432"
  );
  defaultOpts.ssl = config.postgres.ssl;

  let opts = defaultOpts;
  if (passedOpts) {
    opts = { ...defaultOpts, ...passedOpts };
  }

  const pool = new pg.Pool(opts);

  /**
   * Just in case the pool errors, and recommended by pg docs.
   * "It is important you add an event listener to the pool to catch errors. Just like other event emitters,
   *  if a pool emits an error event and no listeners are added node will emit an uncaught error and potentially
   *  exit."
   */
  pool.on("error", (err) => {
    log.error("Pool error", err);
  });

  // TODO: figure out metrics for multiple pools...
  initPostgresMetrics(pool);

  return pool;
}

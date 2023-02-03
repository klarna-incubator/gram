import fs from "fs";
import { Pool, PoolClient, PoolConfig } from "pg";
import { getLogger } from "../logger";
import secrets from "../secrets";
import metricsClient from "prom-client";

const log = getLogger("postgres");

type Transaction<T> = (client: PoolClient) => Promise<T>;

/**
 * Wrapper class around pg's Pool to allow us to better
 * handle clients used for transactions.
 *
 * The upstream library has an issue where if transactions time-out
 * they don't propagate correctly as an error and clients are left in a broken state
 * without the pool correctly terminating them.
 */
export class GramConnectionPool {
  _pool: Pool;

  constructor(pool: Pool) {
    this._pool = pool;
  }

  async query(query: string, ...args: any[]) {
    log.info(args);
    return this._pool.query(query, ...args);
  }

  async runTransaction<T>(transaction: Transaction<T>): Promise<T> {
    const client = await this._pool.connect();

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
function initPostgresMetrics(pool: Pool) {
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

export async function createPostgresPool(passedOpts?: PoolConfig) {
  const defaultOpts: PoolConfig = {
    max: 100,
    connectionTimeoutMillis:
      process.env.NODE_ENV && ["test"].includes(process.env.NODE_ENV)
        ? 0
        : 5000,
  };

  defaultOpts.host = await secrets.get("data._providers.postgres.host");
  defaultOpts.user = await secrets.get("data._providers.postgres.user");
  defaultOpts.password = await secrets.get("data._providers.postgres.password");
  defaultOpts.database = await secrets.get("data._providers.postgres.database");
  defaultOpts.port = parseInt(
    await secrets.get("data._providers.postgres.port")
  );

  // Enable SSL except in development and test environment
  //TODO: should be configuration...
  defaultOpts.ssl = !["development", "test", "demo"].includes(
    process.env.NODE_ENV!
  );

  log.debug(`Postgres TLS/SSL: ${defaultOpts.ssl}`);

  //TODO: should be configuration...
  // if (defaultOpts.ssl) {
  // Load AWS RDS CA to verify connection
  // defaultOpts.ssl = {
  //   ca: fs.readFileSync("/opt/rds-ca-2019-root.pem", "ascii"),
  // };
  // }

  let opts = defaultOpts;
  if (passedOpts) {
    opts = { ...defaultOpts, ...passedOpts };
  }

  const pool = new Pool(opts);

  /**
   * Just in case the pool errors, and recommended by pg docs.
   * "It is important you add an event listener to the pool to catch errors. Just like other event emitters, if a pool emits an error event and no listeners are added node will emit an uncaught error and potentially exit."
   */
  pool.on("error", (err) => {
    log.error("Pool error", err);
  });

  // TODO: will refactor DAL and more to use this wrapper class.
  // return new GramConnectionPool(pool);

  initPostgresMetrics(pool);

  return pool;
}

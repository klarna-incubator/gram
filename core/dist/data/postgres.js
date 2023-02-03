"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostgresPool = exports.GramConnectionPool = void 0;
const pg_1 = require("pg");
const logger_1 = require("../logger");
const secrets_1 = __importDefault(require("../secrets"));
const prom_client_1 = __importDefault(require("prom-client"));
const log = (0, logger_1.getLogger)("postgres");
/**
 * Wrapper class around pg's Pool to allow us to better
 * handle clients used for transactions.
 *
 * The upstream library has an issue where if transactions time-out
 * they don't propagate correctly as an error and clients are left in a broken state
 * without the pool correctly terminating them.
 */
class GramConnectionPool {
    constructor(pool) {
        this._pool = pool;
    }
    query(query, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            log.info(args);
            return this._pool.query(query, ...args);
        });
    }
    runTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this._pool.connect();
            try {
                // Do transaction stuff
                yield client.query("BEGIN");
                const result = yield transaction(client);
                yield client.query("COMMIT");
                return result;
            }
            catch (err) {
                log.error(`Error during postgres transaction: ${err}`);
                yield client.query("ROLLBACK");
                throw err;
            }
            finally {
                // Ensure client is released and properly cleaned up, in case of error
                client.release(true); // true here forces the recreation of this client. This is due to an issue in node-postgres,
                // where timedout queries are not correctly handled. In practice, this meant that broken clients were getting recycled.
                // When a timeout happens, it does not get caught in the above catch-statement.
            }
        });
    }
    end() {
        return this._pool.end();
    }
}
exports.GramConnectionPool = GramConnectionPool;
let metricsInited = false;
function initPostgresMetrics(pool) {
    if (metricsInited) {
        return;
    }
    metricsInited = true;
    new prom_client_1.default.Gauge({
        name: "postgres_waiting_count",
        help: "The number of queued requests waiting on a client when all clients are checked out.",
        collect() {
            this.set(pool.waitingCount);
        },
    });
    new prom_client_1.default.Gauge({
        name: "postgres_idle_count",
        help: "The number of clients which are not checked out but are currently idle in the pool.",
        collect() {
            this.set(pool.idleCount);
        },
    });
    new prom_client_1.default.Gauge({
        name: "postgres_total_count",
        help: "The total number of clients existing within the pool.",
        collect() {
            this.set(pool.totalCount);
        },
    });
}
function createPostgresPool(passedOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultOpts = {
            max: 100,
            connectionTimeoutMillis: process.env.NODE_ENV && ["test"].includes(process.env.NODE_ENV)
                ? 0
                : 5000,
        };
        defaultOpts.host = yield secrets_1.default.get("data._providers.postgres.host");
        defaultOpts.user = yield secrets_1.default.get("data._providers.postgres.user");
        defaultOpts.password = yield secrets_1.default.get("data._providers.postgres.password");
        defaultOpts.database = yield secrets_1.default.get("data._providers.postgres.database");
        defaultOpts.port = parseInt(yield secrets_1.default.get("data._providers.postgres.port"));
        // Enable SSL except in development and test environment
        //TODO: should be configuration...
        defaultOpts.ssl = !["development", "test", "demo"].includes(process.env.NODE_ENV);
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
            opts = Object.assign(Object.assign({}, defaultOpts), passedOpts);
        }
        const pool = new pg_1.Pool(opts);
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
    });
}
exports.createPostgresPool = createPostgresPool;
//# sourceMappingURL=postgres.js.map
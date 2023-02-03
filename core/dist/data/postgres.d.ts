import { Pool, PoolClient, PoolConfig } from "pg";
type Transaction<T> = (client: PoolClient) => Promise<T>;
/**
 * Wrapper class around pg's Pool to allow us to better
 * handle clients used for transactions.
 *
 * The upstream library has an issue where if transactions time-out
 * they don't propagate correctly as an error and clients are left in a broken state
 * without the pool correctly terminating them.
 */
export declare class GramConnectionPool {
    _pool: Pool;
    constructor(pool: Pool);
    query(query: string, ...args: any[]): Promise<import("pg").QueryResult<any>>;
    runTransaction<T>(transaction: Transaction<T>): Promise<T>;
    end(): Promise<void>;
}
export declare function createPostgresPool(passedOpts?: PoolConfig): Promise<Pool>;
export {};
//# sourceMappingURL=postgres.d.ts.map
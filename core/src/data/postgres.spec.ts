import { randomUUID } from "crypto";
import { Pool } from "pg";
import { createPostgresPool, GramConnectionPool } from "./postgres";

describe("postgres pool", () => {
  let pool: GramConnectionPool | Pool | null = null;
  afterEach(() => {
    pool && pool.end();
    pool = null;
  });

  it("should throw on syntax error", async () => {
    pool = new GramConnectionPool(await createPostgresPool());

    let errd = false;
    try {
      await pool.query("invalid sql :)");
    } catch (err) {
      console.log(err);
      errd = true;
    }
    expect(errd).toBeTruthy();
  });

  it("should close connections that timed-out", async () => {
    pool = new GramConnectionPool(
      await createPostgresPool({
        query_timeout: 100,
      })
    );

    let errd = false;
    try {
      await pool.query("SELECT pg_sleep(5)");
    } catch (err) {
      errd = true;
      expect(err).toBeTruthy();
    }
    expect(errd).toBeTruthy();
  });

  it("should be able to connect and query", async () => {
    pool = new GramConnectionPool(await createPostgresPool());

    const result = await pool.query("SELECT 1 as result");

    expect(result.rowCount).toBe(1);
    expect(result.rows[0].result).toBe(1);
  });

  it("should not reused errored client", async () => {
    pool = new GramConnectionPool(
      await createPostgresPool({
        max: 1,
        query_timeout: 100,
      })
    );

    try {
      await pool.runTransaction(async (client) => {
        try {
          console.log("during transaction");
          await client.query("SELECT pg_sleep(5)");
        } catch (err) {
          // The error will be handled here first, and then the transaction will continue.
          // However, any time the client is used again, the error will be thrown again.
          // Might be worth wrapping the client as well in order to be able to crash earlier.
          // Otherwise we get confusing behaviour here like:
          //   transaction {
          //   try {
          //     client.query("some broken query")
          //   } catch (err) { // log stuff, think problem is fixed }
          //   client.query("next part of transaction") -> error now because client is still broken.
          //   }
          console.log("transaction err", err);
          expect(err).toBeTruthy();
        }
      });
    } catch (err) {
      // Exception should be propagated up.
      expect(err).toBeTruthy();
    }

    console.log("after transaction");

    const result = await pool.query("SELECT 1 as result");
    expect(result.rowCount).toBe(1);
    expect(result.rows[0].result).toBe(1);
  });

  //   it("should not hang if pool is exhausted?", async () => {});

  describe("runTransaction", () => {
    it("should release back clients", async () => {
      pool = new GramConnectionPool(
        await createPostgresPool({
          max: 1,
        })
      );

      expect(pool._pool.totalCount).toBe(0);

      await pool.runTransaction(async (client) => {
        await client.query("SELECT 1");
      });

      expect(pool._pool.totalCount).toBe(0); // 0 because runTransaction destroys the client

      await pool.query("SELECT 1");
      expect(pool._pool.totalCount).toBe(1); // 1 because normal queries don't destory the client
      await pool.query("SELECT 1");
      expect(pool._pool.totalCount).toBe(1);
    });

    it("should commit", async () => {
      pool = new GramConnectionPool(
        await createPostgresPool({
          max: 1,
        })
      );

      const uid = randomUUID();
      await pool.runTransaction(async (trans) => {
        await trans.query(
          "INSERT INTO user_activity (user_id, model_id, action_type) VALUES ($1::varchar, $2::uuid, $3::varchar)",
          [uid, randomUUID(), randomUUID()]
        );
      });

      const res = await pool.query(
        "SELECT * FROM user_activity WHERE user_id = $1::varchar",
        [uid]
      );

      expect(res.rowCount).toBe(1);
      expect(res.rows[0]["model_id"]).toBeTruthy();
    });

    it("should rollback on error", async () => {
      pool = new GramConnectionPool(
        await createPostgresPool({
          max: 1,
        })
      );

      const uid = randomUUID();

      try {
        await pool.runTransaction(async (trans) => {
          await trans.query(
            "INSERT INTO user_activity (user_id, model_id, action_type) VALUES ($1::varchar, $2::uuid, $3::varchar)",
            [uid, randomUUID(), randomUUID()]
          );
          await trans.query("fail");
        });
      } catch (err) {
        expect(err).toBeTruthy();
      }

      const res = await pool.query(
        "SELECT * FROM user_activity WHERE user_id = $1::varchar",
        [uid]
      );

      expect(res.rowCount).toBe(0);
    });
  });
});

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
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const postgres_1 = require("./postgres");
describe("postgres pool", () => {
    let pool = null;
    afterEach(() => {
        pool && pool.end();
        pool = null;
    });
    it("should throw on syntax error", () => __awaiter(void 0, void 0, void 0, function* () {
        pool = new postgres_1.GramConnectionPool(yield (0, postgres_1.createPostgresPool)());
        let errd = false;
        try {
            yield pool.query("invalid sql :)");
        }
        catch (err) {
            console.log(err);
            errd = true;
        }
        expect(errd).toBeTruthy();
    }));
    it("should close connections that timed-out", () => __awaiter(void 0, void 0, void 0, function* () {
        pool = new postgres_1.GramConnectionPool(yield (0, postgres_1.createPostgresPool)({
            query_timeout: 100,
        }));
        let errd = false;
        try {
            yield pool.query("SELECT pg_sleep(5)");
        }
        catch (err) {
            errd = true;
            expect(err).toBeTruthy();
        }
        expect(errd).toBeTruthy();
    }));
    it("should be able to connect and query", () => __awaiter(void 0, void 0, void 0, function* () {
        pool = new postgres_1.GramConnectionPool(yield (0, postgres_1.createPostgresPool)());
        const result = yield pool.query("SELECT 1 as result");
        expect(result.rowCount).toBe(1);
        expect(result.rows[0].result).toBe(1);
    }));
    it("should not reused errored client", () => __awaiter(void 0, void 0, void 0, function* () {
        pool = new postgres_1.GramConnectionPool(yield (0, postgres_1.createPostgresPool)({
            max: 1,
            query_timeout: 100,
        }));
        try {
            yield pool.runTransaction((client) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    console.log("during transaction");
                    yield client.query("SELECT pg_sleep(5)");
                }
                catch (err) {
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
            }));
        }
        catch (err) {
            // Exception should be propagated up.
            expect(err).toBeTruthy();
        }
        console.log("after transaction");
        const result = yield pool.query("SELECT 1 as result");
        expect(result.rowCount).toBe(1);
        expect(result.rows[0].result).toBe(1);
    }));
    //   it("should not hang if pool is exhausted?", async () => {});
    describe("runTransaction", () => {
        it("should release back clients", () => __awaiter(void 0, void 0, void 0, function* () {
            pool = new postgres_1.GramConnectionPool(yield (0, postgres_1.createPostgresPool)({
                max: 1,
            }));
            expect(pool._pool.totalCount).toBe(0);
            yield pool.runTransaction((client) => __awaiter(void 0, void 0, void 0, function* () {
                yield client.query("SELECT 1");
            }));
            expect(pool._pool.totalCount).toBe(0); // 0 because runTransaction destroys the client
            yield pool.query("SELECT 1");
            expect(pool._pool.totalCount).toBe(1); // 1 because normal queries don't destory the client
            yield pool.query("SELECT 1");
            expect(pool._pool.totalCount).toBe(1);
        }));
        it("should commit", () => __awaiter(void 0, void 0, void 0, function* () {
            pool = new postgres_1.GramConnectionPool(yield (0, postgres_1.createPostgresPool)({
                max: 1,
            }));
            const uid = (0, crypto_1.randomUUID)();
            yield pool.runTransaction((trans) => __awaiter(void 0, void 0, void 0, function* () {
                yield trans.query("INSERT INTO user_activity (user_id, model_id, action_type) VALUES ($1::varchar, $2::uuid, $3::varchar)", [uid, (0, crypto_1.randomUUID)(), (0, crypto_1.randomUUID)()]);
            }));
            const res = yield pool.query("SELECT * FROM user_activity WHERE user_id = $1::varchar", [uid]);
            expect(res.rowCount).toBe(1);
            expect(res.rows[0]["model_id"]).toBeTruthy();
        }));
        it("should rollback on error", () => __awaiter(void 0, void 0, void 0, function* () {
            pool = new postgres_1.GramConnectionPool(yield (0, postgres_1.createPostgresPool)({
                max: 1,
            }));
            const uid = (0, crypto_1.randomUUID)();
            try {
                yield pool.runTransaction((trans) => __awaiter(void 0, void 0, void 0, function* () {
                    yield trans.query("INSERT INTO user_activity (user_id, model_id, action_type) VALUES ($1::varchar, $2::uuid, $3::varchar)", [uid, (0, crypto_1.randomUUID)(), (0, crypto_1.randomUUID)()]);
                    yield trans.query("fail");
                }));
            }
            catch (err) {
                expect(err).toBeTruthy();
            }
            const res = yield pool.query("SELECT * FROM user_activity WHERE user_id = $1::varchar", [uid]);
            expect(res.rowCount).toBe(0);
        }));
    });
});
//# sourceMappingURL=postgres.spec.js.map
"use strict";
// This file runs migrations for the Gram API. Be careful when modifying it.
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
const postgres_migrations_1 = require("postgres-migrations");
const postgres_1 = require("./postgres");
const logger_1 = require("../logger");
const secrets_1 = __importDefault(require("../secrets"));
const typescript_1 = require("typescript");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const log = (0, logger_1.getLogger)("migrate");
        if (!process.env.NODE_ENV) {
            log.error("Please specify which environment should be migrated via the environment variable NODE_ENV");
            return typescript_1.sys.exit(1);
        }
        const databaseName = (yield secrets_1.default.get("data._providers.postgres.database"));
        const host = (yield secrets_1.default.get("data._providers.postgres.host"));
        log.info(`Starting migration for ${process.env.NODE_ENV} (${host} - ${databaseName})`);
        const pool = new postgres_1.GramConnectionPool(yield (0, postgres_1.createPostgresPool)());
        yield (0, postgres_migrations_1.createDb)(databaseName, { client: pool._pool });
        log.info("Created DB (if not exist): " + databaseName);
        const migrationDir = __dirname.includes("/dist/")
            ? __dirname + "/../../src/data/migrations"
            : __dirname + "/migrations";
        const migs = yield (0, postgres_migrations_1.migrate)({ client: pool._pool }, migrationDir);
        migs.forEach((mig) => {
            log.info(`Ran migration: ${mig.name}`);
        });
        log.info("Successfully ran all migrations");
    });
}
main();
//# sourceMappingURL=migrate.js.map
"use strict";
/**
 * Secrets reader module
 *
 * Could be abstracted to the Packs in the future, but would require
 * some refactoring as currently the PackCompiler relies on the DAL,
 * which itself uses secrets to init the database connection.
 *
 * @module secrets
 * @exports secrets
 */
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
const config_1 = __importDefault(require("config"));
const logger_1 = require("../logger");
const errors_1 = require("./errors");
const ssm_1 = require("./ssm");
const config_2 = require("./config");
const log = (0, logger_1.getLogger)("secrets");
class Secrets {
    constructor() {
        this.providers = new Map();
        this.addProvider(new ssm_1.SSMSecretProvider());
        this.addProvider(new config_2.ConfigSecretProvider());
    }
    addProvider(provider) {
        if (this.providers.has(provider.key)) {
            throw new errors_1.InvalidSecretProviderError(`SecretProvider with name ${provider} already exists`);
        }
        this.providers.set(provider.key, provider);
    }
    /**
     * Retrieves secret from the specified tag / namespace
     * @param key
     * @throws {InvalidSecretError}
     * @returns {Promise}
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = config_1.default.get("secrets.provider");
            if (!provider) {
                throw new errors_1.InvalidSecretProviderError("No SecretProvider specified. Ensure secrets.provider is set in config.");
            }
            if (!this.providers.has(provider)) {
                throw new errors_1.InvalidSecretProviderError(`No such secretprovider: ${provider}.`);
            }
            const impl = this.providers.get(provider);
            log.info(`Fetching secret ${key} from ${provider}`);
            const value = yield impl.get(key);
            if (value === undefined) {
                throw new errors_1.InvalidSecretError(`Secret not found ${key}`);
            }
            return value;
        });
    }
    /**
     * Retrieves secret from the specified tag, if it does not exist then it returns _default.
     * @param key
     * @param _default
     * @returns
     */
    getOrDefault(key, _default) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.get(key);
            }
            catch (error) {
                if (error instanceof errors_1.InvalidSecretError) {
                    return _default;
                }
                throw error;
            }
        });
    }
}
const secrets = new Secrets();
exports.default = secrets;
//# sourceMappingURL=index.js.map
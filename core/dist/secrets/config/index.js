"use strict";
/**
 * Pulls secrets from config module - ideally for dev environment
 * @module secrets/config
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
exports.ConfigSecretProvider = void 0;
const config_1 = __importDefault(require("config"));
const errors_1 = require("../errors");
class ConfigSecretProvider {
    constructor() {
        this.key = "config";
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (config_1.default.has(key))
                return config_1.default.get(key);
            throw new errors_1.InvalidSecretError(`Found no such secret with key ${key}`);
        });
    }
}
exports.ConfigSecretProvider = ConfigSecretProvider;
//# sourceMappingURL=index.js.map
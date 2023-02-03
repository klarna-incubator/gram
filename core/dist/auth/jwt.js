"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.validateToken = exports.generateToken = exports.validateAuthToken = exports.generateAuthToken = void 0;
const config_1 = __importDefault(require("config"));
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const secrets_1 = __importDefault(require("../secrets"));
const globalOpts = {
    algorithm: "HS512",
};
const secretMap = new Map();
function getSecret(purpose) {
    return __awaiter(this, void 0, void 0, function* () {
        let secret = secretMap.get(purpose);
        if (!secret) {
            secret = yield secrets_1.default.get(`jwt.secret.${purpose}`);
            if (!secret || secret.length < 64) {
                // byte == 2 chars
                throw new Error(`Secret length should not be less than 256 bits of security (32 bytes => expecting a 64 character long hexadecimal string, but was ${secret.length} long)`);
            }
            secretMap.set(purpose, secret);
        }
        return secret;
    });
}
function generateAuthToken(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        return generateToken(payload, config_1.default.get("jwt.ttl"), "auth");
    });
}
exports.generateAuthToken = generateAuthToken;
function validateAuthToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        return validateToken(token, "auth");
    });
}
exports.validateAuthToken = validateAuthToken;
function generateToken(payload, ttl = config_1.default.get("jwt.ttl"), purpose = "auth") {
    return __awaiter(this, void 0, void 0, function* () {
        const requiredClaims = {
            iss: "gram",
        };
        const finalClaims = Object.assign(Object.assign({}, payload), requiredClaims);
        const secret = yield getSecret(purpose);
        const token = jsonwebtoken_1.default.sign(finalClaims, secret, Object.assign({ expiresIn: ttl }, globalOpts));
        return token;
    });
}
exports.generateToken = generateToken;
function validateToken(token, purpose = "auth") {
    return __awaiter(this, void 0, void 0, function* () {
        const secret = yield getSecret(purpose);
        const result = jsonwebtoken_1.default.verify(token, secret, globalOpts);
        if (typeof result === "string") {
            // For some reason jsonwebtoken can return a string when verifying, which we dont want.
            throw new jsonwebtoken_1.JsonWebTokenError("invalid token, verify returned a string not object");
        }
        return result;
    });
}
exports.validateToken = validateToken;
//# sourceMappingURL=jwt.js.map
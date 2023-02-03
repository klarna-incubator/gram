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
const config_1 = __importDefault(require("config"));
const jsonwebtoken_1 = require("jsonwebtoken");
const Role_1 = require("./models/Role");
const jwt = __importStar(require("./jwt"));
const payload = {
    name: "user name",
    sub: "gram",
    roles: [Role_1.Role.User],
    teams: [{ name: "some-product-team", id: "42" }],
};
describe("JWT wrapper for authentication", () => {
    describe("token generation", () => {
        it("should generate a valid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const token = yield jwt.generateToken(payload);
            const parts = token.split(".");
            const algStr = Buffer.from(parts[0], "base64");
            const payloadStr = Buffer.from(parts[1], "base64");
            expect(typeof JSON.parse(algStr.toString())).toBe("object");
            expect(typeof JSON.parse(payloadStr.toString())).toBe("object");
            expect(parts.length).toBe(3);
        }));
        it("should match original payload sub", () => __awaiter(void 0, void 0, void 0, function* () {
            const token = yield jwt.generateToken(payload);
            const parts = token.split(".");
            const payloadStr = Buffer.from(parts[1], "base64");
            const tokenPayload = JSON.parse(payloadStr.toString());
            expect(payload.sub).toEqual(tokenPayload.sub);
        }));
        it("should contain valid expiration", () => __awaiter(void 0, void 0, void 0, function* () {
            const token = yield jwt.generateToken(payload);
            const now = Math.floor(Date.now() / 1000);
            const parts = token.split(".");
            const payloadStr = Buffer.from(parts[1], "base64");
            const tokenPayload = JSON.parse(payloadStr.toString());
            expect(now - tokenPayload.exp).toBeLessThanOrEqual(config_1.default.get("jwt.ttl"));
        }));
    });
    describe("token validation", () => {
        it("should verify valid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const token = yield jwt.generateToken(payload);
            const tokenPayload = yield jwt.validateToken(token);
            expect(payload.sub).toEqual(tokenPayload.sub);
        }));
        it("should verify valid token with purpose", () => __awaiter(void 0, void 0, void 0, function* () {
            const token = yield jwt.generateToken(payload, 5000, "csrf");
            const tokenPayload = yield jwt.validateToken(token, "csrf");
            expect(payload.sub).toEqual(tokenPayload.sub);
        }));
        it("should reject invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
            expect(() => jwt.validateToken("invalid_token")).rejects.toThrow(jsonwebtoken_1.JsonWebTokenError);
        }));
        it("should detect expired token", () => __awaiter(void 0, void 0, void 0, function* () {
            const token = yield jwt.generateToken(payload, -1);
            expect(() => jwt.validateToken(token)).rejects.toThrow(jsonwebtoken_1.TokenExpiredError);
        }));
        it("should reject unsecure JWT", () => __awaiter(void 0, void 0, void 0, function* () {
            const token = "eyJhbGciOiJub25lIn0.eyJzb21lIjoidGVzdCJ9.";
            expect(() => jwt.validateToken(token)).rejects.toThrow(jsonwebtoken_1.JsonWebTokenError);
        }));
        it("should reject JWT for different purpose", () => __awaiter(void 0, void 0, void 0, function* () {
            const token = yield jwt.generateToken(payload, 5000, "auth");
            expect(() => jwt.validateToken(token, "csrf")).rejects.toThrow(jsonwebtoken_1.JsonWebTokenError);
        }));
    });
});
//# sourceMappingURL=jwt.spec.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRequiredMiddleware = exports.validateTokenMiddleware = void 0;
const jwt = __importStar(require("@gram/core/dist/auth/jwt"));
const logger_1 = require("@gram/core/dist/logger");
const sentry_1 = require("../util/sentry");
const Sentry = __importStar(require("@sentry/node"));
const log = (0, logger_1.getLogger)("authMw");
function validateTokenMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        let token = "";
        const authString = req.headers["authorization"] || "no-auth";
        if (authString.toLowerCase().startsWith("bearer ")) {
            token = authString.replace(/^bearer /i, "");
        }
        if (token) {
            try {
                req.user = yield jwt.validateToken(token);
                if ((0, sentry_1.hasSentry)()) {
                    Sentry.setUser({ email: req.user.sub, roles: req.user.roles });
                }
            }
            catch (error) {
                log.info(`Validating token resulted to: ${error.message}`);
                // TODO: Error on suspicious errors (failed signature)
            }
        }
        return next();
    });
}
exports.validateTokenMiddleware = validateTokenMiddleware;
function authRequiredMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.user) {
            return res.sendStatus(401);
        }
        return next();
    });
}
exports.authRequiredMiddleware = authRequiredMiddleware;
//# sourceMappingURL=auth.js.map
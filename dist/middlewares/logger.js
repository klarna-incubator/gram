"use strict";
/**
 * Logger middleware
 * @exports logger
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
const lodash_1 = __importDefault(require("lodash"));
function applyFilters(obj, blocklist, allowlist) {
    if (!obj)
        return {};
    return Object.keys(obj)
        .filter((key) => !blocklist || blocklist.length === 0 || !blocklist.includes(key))
        .filter((key) => !allowlist || allowlist.length === 0 || allowlist.includes(key))
        .reduce((final, key) => {
        final[key] = obj[key];
        return final;
    }, {});
}
function simplifiedLogline(log, { method, originalUrl, body, latencyMs, }) {
    log.info(`${method} ${originalUrl} ${latencyMs}ms`);
    if (["POST", "PATCH", "PUT"].includes(method)) {
        log.debug(`body ${JSON.stringify(body)}`);
    }
}
/**
 * @param {object} opts
 * @returns {*} middleware
 */
function logger(opts) {
    const log = opts.logger;
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        const method = req.method;
        const user = req.user
            ? lodash_1.default.pick(req.user, [
                "sub",
                "roles",
                "teams",
                "iss",
                "exp",
                "iat",
                "provider",
            ])
            : "anonymous";
        const originalUrl = req.originalUrl;
        const path = req.path;
        const srcIp = req.ip;
        const headers = applyFilters(req.headers, opts.excludeKeys.header, opts.includeKeys.header);
        const body = applyFilters(req.body, opts.excludeKeys.body, opts.includeKeys.body);
        const params = applyFilters(req.params, opts.excludeKeys.param, opts.includeKeys.param);
        const query = applyFilters(req.query, opts.excludeKeys.query, opts.includeKeys.query);
        const tStart = Date.now();
        res.on("finish", () => {
            const status = res.statusCode;
            const latencyMs = Date.now() - tStart;
            const logEvent = {
                meta: {
                    method,
                    user,
                    originalUrl,
                    path,
                    srcIp,
                    status,
                },
                payload: {
                    headers,
                    body,
                    params,
                    query,
                    latencyMs,
                },
                // TODO: make included headers configurable (maybe reuse sentry ones?)
                // correlation_id: correlationId,
            };
            if (opts.simplified) {
                simplifiedLogline(log, { method, latencyMs, body, originalUrl });
            }
            else {
                log.info(logEvent);
            }
        });
        next();
    });
}
exports.default = logger;
//# sourceMappingURL=logger.js.map
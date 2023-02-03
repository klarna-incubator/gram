"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const config_1 = __importDefault(require("config"));
function securityHeaders() {
    const allowedImgs = [];
    const c = config_1.default.get("allowedSrc.img");
    if (typeof c === "string") {
        allowedImgs.push(c);
    }
    else if (Array.isArray(c)) {
        allowedImgs.push(...c);
    }
    return (0, helmet_1.default)({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "script-src": ["'self'"],
                // unsafe-inline is needed on style due to MUI using it... and adding a nonce/hash is complicated.
                "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
                "font-src": ["https://fonts.gstatic.com"],
                "img-src": ["'self'", ...allowedImgs],
            },
        },
        // allows loading resources from other domains, e.g. github avatar, without explicit CORS headers set on the other domains' end https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy
        crossOriginEmbedderPolicy: false,
    });
}
exports.securityHeaders = securityHeaders;
//# sourceMappingURL=securityHeaders.js.map
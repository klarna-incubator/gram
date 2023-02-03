"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authz = exports.AuthzMiddleware = void 0;
const CurrentAuthz_1 = require("@gram/core/dist/auth/CurrentAuthz");
function AuthzMiddleware(options) {
    const authz = new Authz(options);
    const authzMiddlewareFunction = (req, resp, next) => {
        authz.handleRequest(req);
        next();
    };
    const extension = {
        authz,
        any: (...roles) => {
            return (req, resp, next) => {
                authz.handleRequest(req).any(...roles);
                next();
            };
        },
        all: (...roles) => {
            return (req, resp, next) => {
                authz.handleRequest(req).all(...roles);
                next();
            };
        },
        is: (role) => {
            return (req, resp, next) => {
                authz.handleRequest(req).is(role);
                next();
            };
        },
    };
    return Object.assign(authzMiddlewareFunction, extension);
}
exports.AuthzMiddleware = AuthzMiddleware;
class Authz {
    constructor(options) {
        this.options = options;
    }
    handleRequest(req) {
        req.authz = new CurrentAuthz_1.CurrentAuthz(req, this.options.dal);
        return req.authz;
    }
}
exports.Authz = Authz;
//# sourceMappingURL=authz.js.map
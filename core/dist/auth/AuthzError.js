"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthzError = void 0;
class AuthzError extends Error {
    constructor(reason) {
        super(reason);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, AuthzError.prototype);
    }
}
exports.AuthzError = AuthzError;
//# sourceMappingURL=AuthzError.js.map
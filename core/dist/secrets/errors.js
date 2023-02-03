"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidSecretProviderError = exports.InvalidSecretError = void 0;
class InvalidSecretError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidSecretError";
        Object.setPrototypeOf(this, InvalidSecretError.prototype);
    }
}
exports.InvalidSecretError = InvalidSecretError;
class InvalidSecretProviderError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidSecretProvider";
        Object.setPrototypeOf(this, InvalidSecretProviderError.prototype);
    }
}
exports.InvalidSecretProviderError = InvalidSecretProviderError;
//# sourceMappingURL=errors.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotAuthenticatedError = exports.InvalidInputError = exports.NotFoundError = void 0;
class NotFoundError extends Error {
    constructor() {
        super();
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
class InvalidInputError extends Error {
    constructor(msg) {
        super(msg);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, InvalidInputError.prototype);
    }
}
exports.InvalidInputError = InvalidInputError;
class NotAuthenticatedError extends Error {
    constructor(msg) {
        super(msg);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, NotAuthenticatedError.prototype);
    }
}
exports.NotAuthenticatedError = NotAuthenticatedError;
//# sourceMappingURL=errors.js.map
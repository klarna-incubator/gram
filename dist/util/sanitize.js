"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeEmail = void 0;
/**
 * Sanitize email by replacing any non-alphanumeric ascii characters + @ . - and _
 * Might not cover all cases, but hopefully good enough.
 * @param email
 * @returns
 */
function sanitizeEmail(rawEmail) {
    if (!rawEmail)
        return "";
    return rawEmail.replace(/[^A-Za-z0-9@.+\-_]+/g, "");
}
exports.sanitizeEmail = sanitizeEmail;
//# sourceMappingURL=sanitize.js.map
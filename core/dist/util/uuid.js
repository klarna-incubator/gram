"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUUID = void 0;
const REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
function validateUUID(uuid) {
    return typeof uuid === "string" && REGEX.test(uuid);
}
exports.validateUUID = validateUUID;
//# sourceMappingURL=uuid.js.map
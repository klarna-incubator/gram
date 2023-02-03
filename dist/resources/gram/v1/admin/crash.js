"use strict";
/**
 * Throws an error. Just want this to check if error reporting (e.g. sentry) is working ok.
 *
 * Examples:
 * GET /api/v1/admin/crash
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
Object.defineProperty(exports, "__esModule", { value: true });
function crash(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        throw new Error(`Crash on purpose triggered by ${req.user.sub}`);
    });
}
exports.default = crash;
//# sourceMappingURL=crash.js.map
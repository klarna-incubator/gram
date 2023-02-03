"use strict";
/**
 * DELETE /api/v1/token
 *
 * Note: Gram doesn't and shouldn't have token state in any point of the
 * application. This particular endpoint only serves cookie-based clients
 * and instruct them to clear cookies.
 *
 * @exports {function} handler
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
function deleteToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        //TODO: pass through to authProvider in case logic is needed to logout.
        res.end();
    });
}
exports.default = deleteToken;
//# sourceMappingURL=delete.js.map
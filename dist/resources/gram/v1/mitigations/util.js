"use strict";
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
exports.ensureControlAndThreatPermission = void 0;
const AuthzError_1 = require("@gram/core/dist/auth/AuthzError");
const errors_1 = require("@gram/core/dist/util/errors");
function ensureControlAndThreatPermission(dal, modelId, controlId, threatId) {
    return __awaiter(this, void 0, void 0, function* () {
        const [control, threat] = yield Promise.all([
            dal.controlService.getById(controlId),
            dal.threatService.getById(threatId),
        ]);
        // Slightly confusing, this function is used to check that object-level permissions are correct.
        // If either control or threat is deleted, then it's actually a 404 that should
        // be returned to the user. However, since we don't check that before authz...
        if (!control && !threat) {
            throw new errors_1.NotFoundError();
        }
        if ((control === null || control === void 0 ? void 0 : control.modelId) != modelId || (threat === null || threat === void 0 ? void 0 : threat.modelId) != modelId) {
            throw new AuthzError_1.AuthzError(`control or threat modelId ${control === null || control === void 0 ? void 0 : control.modelId} ${threat === null || threat === void 0 ? void 0 : threat.modelId}
      } does not match given modelId ${modelId}`);
        }
    });
}
exports.ensureControlAndThreatPermission = ensureControlAndThreatPermission;
//# sourceMappingURL=util.js.map
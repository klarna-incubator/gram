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
exports._delete = void 0;
const authorization_1 = require("@gram/core/dist/auth/authorization");
const util_1 = require("./util");
function _delete(dal) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { modelId } = req.params;
        const { threatId, controlId } = req.body;
        yield req.authz.hasPermissionsForModelId(modelId, authorization_1.Permission.Write);
        yield (0, util_1.ensureControlAndThreatPermission)(dal, modelId, controlId, threatId);
        const result = yield dal.mitigationService.delete(threatId, controlId);
        return res.json({ deleted: result });
    });
}
exports._delete = _delete;
//# sourceMappingURL=delete.js.map
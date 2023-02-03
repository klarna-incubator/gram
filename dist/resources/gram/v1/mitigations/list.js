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
exports.list = void 0;
const authorization_1 = require("@gram/core/dist/auth/authorization");
/**
 * GET /api/v1/models/{modelId}/mitigations
 * @exports {function} handler
 */
function list(dal) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { modelId } = req.params;
        if (!modelId) {
            return res.sendStatus(400);
        }
        yield req.authz.hasPermissionsForModelId(modelId, authorization_1.Permission.Read);
        const mitigations = yield dal.mitigationService.list(modelId);
        return res.json({ mitigations });
    });
}
exports.list = list;
//# sourceMappingURL=list.js.map
"use strict";
/**
 * GET /api/v1/suggestions/{modelId}
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
const authorization_1 = require("@gram/core/dist/auth/authorization");
const uuid_1 = require("@gram/core/dist/util/uuid");
function list(dal) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { modelId } = req.params;
        if (!(0, uuid_1.validateUUID)(modelId)) {
            res.status(400);
            return res.json({ message: "Invalid modelID" });
        }
        yield req.authz.hasPermissionsForModelId(modelId, authorization_1.Permission.Read);
        const controls = yield dal.suggestionService.listControlSuggestions(modelId);
        const threats = yield dal.suggestionService.listThreatSuggestions(modelId);
        return res.json({ controls, threats });
    });
}
exports.default = list;
//# sourceMappingURL=list.js.map
"use strict";
/**
 * PATCH /api/v1/suggestions/{modelId}/reset
 *
 * Used to e.g. undo rejected/ignored suggestions
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
const authorization_1 = require("@gram/core/dist/auth/authorization");
const Suggestion_1 = require("@gram/core/dist/data/suggestions/Suggestion");
const models_1 = require("@gram/core/dist/suggestions/models");
const uuid_1 = require("@gram/core/dist/util/uuid");
function reset(dal) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { modelId } = req.params;
        const suggestionId = new models_1.SuggestionID(req.body.suggestionId);
        if (!(0, uuid_1.validateUUID)(modelId)) {
            res.status(400);
            return res.json({ message: "Invalid modelID" });
        }
        yield req.authz.hasPermissionsForModelId(modelId, authorization_1.Permission.Write);
        const result = yield dal.suggestionService.setSuggestionStatus(modelId, suggestionId, Suggestion_1.SuggestionStatus.New);
        if (!result)
            res.status(404);
        return res.json({ result });
    });
}
exports.default = reset;
//# sourceMappingURL=reset.js.map
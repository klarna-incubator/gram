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
const authorization_1 = require("@gram/core/dist/auth/authorization");
const uuid_1 = require("@gram/core/dist/util/uuid");
/**
 * GET /api/v1/models/{id}
 * @exports {function} handler
 */
exports.default = (dataModels) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = req.params.id;
    if (!(0, uuid_1.validateUUID)(id)) {
        return res.sendStatus(400);
    }
    const model = yield dataModels.getById(id);
    if (model === null) {
        return res.sendStatus(404);
    }
    yield ((_a = req.authz) === null || _a === void 0 ? void 0 : _a.hasPermissionsForModel(model, authorization_1.Permission.Read));
    yield dataModels.logAction(req.user.sub, id, "get");
    if (!model.data.components) {
        model.data.components = [];
    }
    if (!model.data.dataFlows) {
        model.data.dataFlows = [];
    }
    return res.json({ model });
});
//# sourceMappingURL=get.js.map
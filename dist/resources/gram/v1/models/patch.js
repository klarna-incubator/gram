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
/**
 * PATCH /api/v1/models/{id}
 * @exports {function} handler
 */
exports.default = (dataModels) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { version, data } = req.body;
    yield req.authz.hasPermissionsForModelId(id, authorization_1.Permission.Write);
    const result = yield dataModels.update(id, { version, data });
    if (!result) {
        return res.sendStatus(500);
    }
    yield dataModels.logAction(req.user.sub, id, "patch");
    return res.json({ id, version, data });
});
//# sourceMappingURL=patch.js.map
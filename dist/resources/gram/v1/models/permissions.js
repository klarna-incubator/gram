"use strict";
/**
 * GET /api/v1/models/<id>/permissions
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
exports.default = (dataModels) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const model = yield dataModels.getById(id);
    if (model === null) {
        return res.sendStatus(404);
    }
    const permissions = yield req.authz.getPermissionsForModel(model);
    return res.json({ permissions });
});
//# sourceMappingURL=permissions.js.map
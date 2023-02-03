"use strict";
/**
 * POST /api/v1/models
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
exports.default = (dataModels) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    yield req.authz.hasPermissionsForModelId(id, authorization_1.Permission.Delete);
    const result = yield dataModels.delete(id);
    return res.json({ deleted: result });
});
//# sourceMappingURL=delete.js.map
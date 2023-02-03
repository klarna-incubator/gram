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
exports.getProperties = void 0;
const authorization_1 = require("@gram/core/dist/auth/authorization");
function getProperties(sysPropHandler, dataModels) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        const id = req.params.id;
        const model = yield dataModels.getById(id);
        if (model === null) {
            return res.sendStatus(404);
        }
        yield req.authz.hasPermissionsForModel(model, authorization_1.Permission.Read);
        const properties = yield sysPropHandler.contextualize({ currentRequest: req }, model.systemId);
        return res.json({ properties });
    });
}
exports.getProperties = getProperties;
//# sourceMappingURL=get.js.map
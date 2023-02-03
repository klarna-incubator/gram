"use strict";
/**
 * GET /api/v1/systems/{id}
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
const systems_1 = require("@gram/core/dist/data/systems/systems");
exports.default = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    yield req.authz.hasPermissionsForSystemId(id, authorization_1.Permission.Read);
    const system = yield systems_1.systemProvider.getSystem({ currentRequest: req }, id.toString());
    if (system === null) {
        return res.sendStatus(404);
    }
    return res.json({ system });
});
//# sourceMappingURL=get.js.map
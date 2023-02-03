"use strict";
/**
 * GET /api/v1/models/<id>/set-template
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
const Role_1 = require("@gram/core/dist/auth/models/Role");
exports.default = (dataModels) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        req.authz.is(Role_1.Role.Admin);
        const modelId = req.params.id;
        const { isTemplate } = req.body;
        if (!modelId || typeof isTemplate !== "boolean") {
            return res.status(400).json({ error: "bad input" });
        }
        const result = yield dataModels.setTemplate(modelId, isTemplate);
        return res.json({ result });
    });
};
//# sourceMappingURL=setTemplate.js.map
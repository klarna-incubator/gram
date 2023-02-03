"use strict";
/**
 * GET /api/v1/models
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
const ModelDataService_1 = require("@gram/core/dist/data/models/ModelDataService");
exports.default = (dataModels) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { filter } = req.query;
    if (!filter ||
        !(typeof filter === "string") ||
        !ModelDataService_1.ModelFilters.includes(filter)) {
        return res.sendStatus(400);
    }
    const opts = {
        withSystems: req.query.withSystems === "true",
        user: req.user.sub,
        systemId: (_a = req.query.systemId) === null || _a === void 0 ? void 0 : _a.toString(),
    };
    const models = yield dataModels.list(filter, opts);
    return res.json({ models: models.map((model) => model.toJSON()) });
});
//# sourceMappingURL=list.js.map
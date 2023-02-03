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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authorization_1 = require("@gram/core/dist/auth/authorization");
const Model_1 = __importDefault(require("@gram/core/dist/data/models/Model"));
const logger_1 = require("@gram/core/dist/logger");
const log = (0, logger_1.getLogger)("models.create");
exports.default = (dataModels) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const version = req.body.version;
    const systemId = req.body.systemId;
    const sourceModelId = req.body.sourceModelId;
    if (!version || version === "")
        return res.sendStatus(400);
    const finalSystemId = systemId
        ? systemId
        : "00000000-0000-0000-0000-000000000000";
    const model = new Model_1.default(finalSystemId, version, req.user.sub);
    yield ((_a = req.authz) === null || _a === void 0 ? void 0 : _a.hasPermissionsForModel(model, authorization_1.Permission.Write));
    let id = null;
    if (sourceModelId) {
        const srcModel = yield dataModels.getById(sourceModelId);
        if (srcModel === null) {
            return res.sendStatus(400);
        }
        yield ((_b = req.authz) === null || _b === void 0 ? void 0 : _b.hasPermissionsForModel(srcModel, authorization_1.Permission.Read));
        id = yield dataModels.copy(srcModel.id, model);
    }
    else {
        // Normal creation without any kind of import
        id = yield dataModels.create(model);
    }
    if (id === null)
        throw new Error("Copy of model failed");
    yield dataModels.logAction(req.user.sub, id, "create");
    return res.json({ model: { id } });
});
//# sourceMappingURL=create.js.map
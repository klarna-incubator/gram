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
exports.create = void 0;
const log4js_1 = require("log4js");
const authorization_1 = require("@gram/core/dist/auth/authorization");
const Control_1 = __importDefault(require("@gram/core/dist/data/controls/Control"));
const Mitigation_1 = __importDefault(require("@gram/core/dist/data/mitigations/Mitigation"));
const uuid_1 = require("@gram/core/dist/util/uuid");
const log = (0, log4js_1.getLogger)("controls.create");
function create(dal) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { title, description, componentId, threatIds } = req.body;
        const { modelId } = req.params;
        const inPlace = req.body.inPlace ? req.body.inPlace : false;
        if (title === "" || modelId === "" || componentId === "") {
            return res.sendStatus(400);
        }
        yield req.authz.hasPermissionsForModelId(modelId, authorization_1.Permission.Write);
        const newControl = new Control_1.default(title, description, inPlace, modelId, componentId, req.user.sub);
        const id = yield dal.controlService.create(newControl);
        if (threatIds) {
            yield Promise.all(threatIds.map((threatId) => __awaiter(this, void 0, void 0, function* () {
                if ((0, uuid_1.validateUUID)(threatId)) {
                    const newMitigation = new Mitigation_1.default(threatId, id, req.user.sub);
                    dal.mitigationService.create(newMitigation);
                }
            })));
        }
        return res.json({ control: { id } });
    });
}
exports.create = create;
//# sourceMappingURL=create.js.map
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
/**
 * POST /api/v1/models/{modelId}/mitigation
 * @exports {function} handler
 */
const authorization_1 = require("@gram/core/dist/auth/authorization");
const Mitigation_1 = __importDefault(require("@gram/core/dist/data/mitigations/Mitigation"));
const uuid_1 = require("@gram/core/dist/util/uuid");
const util_1 = require("./util");
function create(dal) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { threatId, controlId } = req.body;
        const { modelId } = req.params;
        if (!(0, uuid_1.validateUUID)(modelId) ||
            !(0, uuid_1.validateUUID)(threatId) ||
            !(0, uuid_1.validateUUID)(controlId)) {
            return res
                .json({
                message: "modelId, threatId and controlId must be valid UUIDs",
            })
                .sendStatus(400);
        }
        // Check authz
        yield req.authz.hasPermissionsForModelId(modelId, authorization_1.Permission.Write);
        yield (0, util_1.ensureControlAndThreatPermission)(dal, modelId, controlId, threatId);
        const newMitigation = new Mitigation_1.default(threatId, controlId, req.user.sub);
        const createRes = yield dal.mitigationService.create(newMitigation);
        if (createRes) {
            return res.json({
                mitigation: {
                    threatId: createRes.threatId,
                    controlId: createRes.controlId,
                },
            });
        }
        else {
            return res.sendStatus(422);
        }
    });
}
exports.create = create;
//# sourceMappingURL=create.js.map
"use strict";
/**
 * PATCH /api/v1/reviews/{id}
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
exports.default = (dal) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { modelId } = req.params;
    const unsupportedArgs = Object.keys(req.body).find((e) => e !== "note" && e !== "reviewedBy");
    if (unsupportedArgs) {
        res
            .status(400)
            .send(`Parameter ${unsupportedArgs} is not supported on this endpoint.`);
    }
    yield req.authz.hasPermissionsForModelId(modelId, authorization_1.Permission.Review);
    const review = yield dal.reviewService.update(modelId, {
        note: req.body.note,
        reviewedBy: req.body.reviewedBy,
    });
    if (!review) {
        res.sendStatus(500);
    }
    return res.json({ review });
});
//# sourceMappingURL=patch.js.map
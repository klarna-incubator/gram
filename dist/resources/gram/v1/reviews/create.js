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
const authorization_1 = require("@gram/core/dist/auth/authorization");
const Review_1 = require("@gram/core/dist/data/reviews/Review");
exports.default = (dal) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { modelId } = req.params;
    const { reviewedBy } = req.body;
    const requestedBy = req.user.sub;
    if (!modelId || !requestedBy || !reviewedBy)
        return res.sendStatus(400);
    yield req.authz.hasPermissionsForModelId(modelId, authorization_1.Permission.Write);
    const review = new Review_1.Review(modelId, requestedBy, Review_1.ReviewStatus.Requested, reviewedBy);
    const id = yield dal.reviewService.create(review);
    if (!id) {
        return res.status(500);
    }
    return res.json({ review });
});
//# sourceMappingURL=create.js.map
"use strict";
/**
 * GET /api/v1/reviews/reviewers
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
const ReviewerProvider_1 = require("@gram/core/dist/data/reviews/ReviewerProvider");
exports.default = (dal) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { modelId } = req.query;
    const ctx = { currentRequest: req };
    if (!modelId) {
        const reviewers = yield ReviewerProvider_1.reviewerProvider.getReviewers(ctx);
        return res.json({ reviewers });
    }
    else {
        const model = yield dal.modelService.getById(modelId);
        if (!model) {
            return res.status(404);
        }
        const reviewers = yield ReviewerProvider_1.reviewerProvider.getReviewersForModel(ctx, model);
        return res.json({ reviewers });
    }
});
//# sourceMappingURL=reviewers.js.map
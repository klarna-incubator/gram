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
const ReviewerProvider_1 = require("@gram/core/dist/data/reviews/ReviewerProvider");
exports.default = (dal) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { modelId } = req.params;
    const { newReviewer } = req.body;
    if (!newReviewer ||
        (yield ReviewerProvider_1.reviewerProvider.lookup({ currentRequest: req }, [newReviewer]))
            .length === 0) {
        return res.sendStatus(400);
    }
    /**
     * Both System Owners and Reviewers should be able to change reviewer.
     */
    yield req.authz.hasAnyPermissionsForModelId(modelId, authorization_1.Permission.Review, authorization_1.Permission.Write);
    const result = yield dal.reviewService.changeReviewer(modelId, newReviewer);
    return res.json({ result });
});
//# sourceMappingURL=changeReviewer.js.map
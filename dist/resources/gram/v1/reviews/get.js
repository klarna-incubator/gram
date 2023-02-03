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
const user_1 = require("@gram/core/dist/auth/user");
const uuid_1 = require("@gram/core/dist/util/uuid");
const ReviewerProvider_1 = require("@gram/core/dist/data/reviews/ReviewerProvider");
/**
 * GET /api/v1/reviews/{modelId}
 * @exports {function} handler
 */
exports.default = (dal) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { modelId } = req.params;
    if (!modelId) {
        return res.sendStatus(400);
    }
    if (!(0, uuid_1.validateUUID)(modelId)) {
        return res.sendStatus(400);
    }
    yield req.authz.hasPermissionsForModelId(modelId, authorization_1.Permission.Read);
    const review = yield dal.reviewService.getByModelId(modelId);
    if (!review) {
        return res.sendStatus(404);
    }
    const requester = yield (0, user_1.lookupUser)({ currentRequest: req }, review.requestedBy);
    const reviewer = yield (0, ReviewerProvider_1.lookupReviewer)({ currentRequest: req }, review.reviewedBy);
    return res.json({
        review: {
            model_id: review.modelId,
            status: review.status,
            note: review.note,
            created_at: review.createdAt,
            updated_at: review.updatedAt,
            approved_at: review.approvedAt,
            requester,
            reviewer,
        },
    });
});
//# sourceMappingURL=get.js.map
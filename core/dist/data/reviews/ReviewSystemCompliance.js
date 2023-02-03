"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewSystemCompliance = void 0;
class ReviewSystemCompliance {
    constructor(SystemID, ApprovedModelId, ApprovedAt, PendingModelId, PendingModelStatus, NoReviewModelId) {
        this.SystemID = SystemID;
        this.ApprovedModelId = ApprovedModelId;
        this.ApprovedAt = ApprovedAt;
        this.PendingModelId = PendingModelId;
        this.PendingModelStatus = PendingModelStatus;
        this.NoReviewModelId = NoReviewModelId;
    }
    toJSON() {
        return {
            system_id: this.SystemID,
            approved_model_id: this.ApprovedModelId,
            approved_at: this.ApprovedAt,
            pending_model_id: this.PendingModelId,
            pending_model_status: this.PendingModelStatus,
            no_review_model_id: this.NoReviewModelId,
        };
    }
}
exports.ReviewSystemCompliance = ReviewSystemCompliance;
//# sourceMappingURL=ReviewSystemCompliance.js.map
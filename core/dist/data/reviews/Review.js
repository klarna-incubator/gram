"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = exports.ReviewStatus = void 0;
var ReviewStatus;
(function (ReviewStatus) {
    ReviewStatus["Requested"] = "requested";
    ReviewStatus["Approved"] = "approved";
    ReviewStatus["Declined"] = "declined";
    ReviewStatus["Canceled"] = "canceled";
    ReviewStatus["MeetingRequested"] = "meeting-requested";
})(ReviewStatus = exports.ReviewStatus || (exports.ReviewStatus = {}));
/**
 * Class definition for review
 */
class Review {
    constructor(modelId, requestedBy, status = ReviewStatus.Requested, reviewedBy = "") {
        this.modelId = modelId;
        this.requestedBy = requestedBy;
        this.status = status;
        this.note = "";
        this.extras = {};
        this.reviewedBy = reviewedBy;
        this.createdAt = new Date(Date.now());
        this.updatedAt = new Date(Date.now());
        this.approvedAt = null;
        this.requestedAt = this.createdAt;
        this.meetingRequestedAt = null;
        this.meetingRequestedReminderSentCount = 0;
        this.requestedReminderSentCount = 0;
    }
    toJSON() {
        return {
            modelId: this.modelId,
            requestedBy: this.requestedBy,
            reviewedBy: this.reviewedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            approvedAt: this.approvedAt,
            meetingRequestedAt: this.meetingRequestedAt,
            meetingRequestedReminderSentCount: this.meetingRequestedReminderSentCount,
            requestedAt: this.requestedAt,
            status: this.status,
            note: this.note,
            extras: this.extras,
        };
    }
}
exports.Review = Review;
//# sourceMappingURL=Review.js.map
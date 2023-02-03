import { ReviewStatus } from "./Review";
export declare class ReviewSystemCompliance {
    SystemID: string;
    ApprovedModelId: string;
    ApprovedAt: string;
    PendingModelId: string;
    PendingModelStatus: ReviewStatus;
    NoReviewModelId: string;
    constructor(SystemID: string, ApprovedModelId: string, ApprovedAt: string, PendingModelId: string, PendingModelStatus: ReviewStatus, NoReviewModelId: string);
    toJSON(): {
        system_id: string;
        approved_model_id: string;
        approved_at: string;
        pending_model_id: string;
        pending_model_status: ReviewStatus;
        no_review_model_id: string;
    };
}
//# sourceMappingURL=ReviewSystemCompliance.d.ts.map
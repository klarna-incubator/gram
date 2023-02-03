import { ReviewStatus } from "./Review";

export class ReviewSystemCompliance {
  constructor(
    public SystemID: string,
    public ApprovedModelId: string,
    public ApprovedAt: string,
    public PendingModelId: string,
    public PendingModelStatus: ReviewStatus,
    public NoReviewModelId: string
  ) {}

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

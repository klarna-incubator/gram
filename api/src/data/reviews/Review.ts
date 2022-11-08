export enum ReviewStatus {
  Requested = "requested",
  Approved = "approved",
  Declined = "declined",
  Canceled = "canceled",
  MeetingRequested = "meeting-requested",
}

/**
 * Class definition for review
 */
export class Review {
  modelId: string;
  requestedBy: string;
  reviewedBy: string;
  status: ReviewStatus;
  note: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt: Date | null;
  requestedAt: Date | null;
  requestedReminderSentCount: number;
  meetingRequestedAt: Date | null;
  meetingRequestedReminderSentCount: number;

  constructor(
    modelId: string,
    requestedBy: string,
    status: ReviewStatus = ReviewStatus.Requested,
    reviewedBy = ""
  ) {
    this.modelId = modelId;
    this.requestedBy = requestedBy;
    this.status = status;
    this.note = "";
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
    };
  }
}

export declare enum ReviewStatus {
    Requested = "requested",
    Approved = "approved",
    Declined = "declined",
    Canceled = "canceled",
    MeetingRequested = "meeting-requested"
}
/**
 * Class definition for review
 */
export declare class Review {
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
    extras: any;
    constructor(modelId: string, requestedBy: string, status?: ReviewStatus, reviewedBy?: string);
    toJSON(): {
        modelId: string;
        requestedBy: string;
        reviewedBy: string;
        createdAt: Date;
        updatedAt: Date;
        approvedAt: Date | null;
        meetingRequestedAt: Date | null;
        meetingRequestedReminderSentCount: number;
        requestedAt: Date | null;
        status: ReviewStatus;
        note: string;
        extras: any;
    };
}
//# sourceMappingURL=Review.d.ts.map
import { Reviewer } from "../auth/models/Reviewer";
import Model from "../data/models/Model";
import { RequestContext } from "../data/providers/RequestContext";
import { ReviewerProvider } from "../data/reviews/ReviewerProvider";
export declare const sampleReviewer: Reviewer;
export declare const sampleOtherReviewer: Reviewer;
declare class TestReviewerProvider implements ReviewerProvider {
    key: string;
    lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]>;
    getReviewersForModel(ctx: RequestContext, model: Model): Promise<Reviewer[]>;
    getReviewers(): Promise<Reviewer[]>;
    getFallbackReviewer(): Promise<Reviewer>;
}
export declare const testReviewerProvider: TestReviewerProvider;
export {};
//# sourceMappingURL=sampleReviewer.d.ts.map
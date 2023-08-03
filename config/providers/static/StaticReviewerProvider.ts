import { Reviewer } from "@gram/core/dist/auth/models/Reviewer";
import Model from "@gram/core/dist/data/models/Model";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { ReviewerProvider } from "@gram/core/dist/data/reviews/ReviewerProvider";

export class StaticReviewerProvider implements ReviewerProvider {
  constructor(
    public reviewers: Reviewer[],
    public fallbackReviewer: Reviewer
  ) {}

  async lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]> {
    return userIds
      .map((uid) => this.reviewers.find((r) => r.sub === uid))
      .filter((r) => !!r) as Reviewer[];
  }
  async getReviewersForModel(
    ctx: RequestContext,
    model: Model
  ): Promise<Reviewer[]> {
    return this.reviewers;
  }
  async getReviewers(ctx: RequestContext): Promise<Reviewer[]> {
    return this.reviewers;
  }
  async getFallbackReviewer(ctx: RequestContext): Promise<Reviewer> {
    return this.fallbackReviewer;
  }
  key: string = "static";
}

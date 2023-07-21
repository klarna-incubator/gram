import { Reviewer } from "../../auth/models/Reviewer";
import Model from "../models/Model";
import { RequestContext } from "../providers/RequestContext";
import { ReviewerProvider } from "./ReviewerProvider";

export class DummyReviewerProvider implements ReviewerProvider {
  key = "default";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lookup(ctx: RequestContext, _userIds: string[]): Promise<Reviewer[]> {
    throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getReviewersForModel(
    ctx: RequestContext,
    _model: Model
  ): Promise<Reviewer[]> {
    throw new Error("Method not implemented.");
  }

  getFallbackReviewer(ctx: RequestContext): Promise<Reviewer> {
    throw new Error("Method not implemented.");
  }

  getReviewers(ctx: RequestContext): Promise<Reviewer[]> {
    throw new Error("Method not implemented.");
  }
}

export class ReviewerHandler {
  constructor() {}

  reviewerProvider: ReviewerProvider = new DummyReviewerProvider();

  setReviewerProvider(newReviewerProvider: ReviewerProvider) {
    this.reviewerProvider = newReviewerProvider;
  }

  /**
   * Lookup a list of users by ID.
   *
   * @param ctx
   * @param userIds list of userIDs
   */
  async lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]> {
    return this.reviewerProvider.lookup(ctx, userIds);
  }

  /**
   *
   * @param ctx
   * @param userId
   */
  async lookupReviewer(
    ctx: RequestContext,
    userId: string
  ): Promise<Reviewer | null> {
    const reviewers = await this.lookup(ctx, [userId]);
    if (!reviewers || reviewers.length === 0) {
      return null;
    }
    return reviewers[0];
  }

  /**
   * Given a Threat Model object, return a list of reviewers
   * that can review the model.
   *
   * @param ctx
   * @param model
   */
  getReviewersForModel(ctx: RequestContext, model: Model): Promise<Reviewer[]> {
    return this.reviewerProvider.getReviewersForModel(ctx, model);
  }

  /**
   * Return all possible Reviewers
   * @param ctx
   */
  getReviewers(ctx: RequestContext): Promise<Reviewer[]> {
    return this.reviewerProvider.getReviewers(ctx);
  }

  /**
   * Return a fallback reviewer, used for e.g. reassignment.
   * @param ctx
   */
  getFallbackReviewer(ctx: RequestContext): Promise<Reviewer> {
    return this.reviewerProvider.getFallbackReviewer(ctx);
  }
}

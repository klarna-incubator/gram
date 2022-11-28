import { Reviewer } from "../../auth/models/Reviewer";
import { getLogger } from "../../logger";
import { Provider } from "../providers/Provider";
import Model from "../models/Model";
import { RequestContext } from "../providers/RequestContext";

class DefaultReviewerProvider implements ReviewerProvider {
  key = "default";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lookup(ctx: RequestContext, _userIds: string[]): Promise<Reviewer[]> {
    throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getReviewersForModel(ctx: RequestContext, _model: Model): Promise<Reviewer[]> {
    throw new Error("Method not implemented.");
  }

  getFallbackReviewer(ctx: RequestContext): Promise<Reviewer> {
    throw new Error("Method not implemented.");
  }

  getReviewers(ctx: RequestContext): Promise<Reviewer[]> {
    throw new Error("Method not implemented.");
  }
}

const log = getLogger("reviewerLookup");

export let reviewerProvider: ReviewerProvider = new DefaultReviewerProvider();

export interface ReviewerProvider extends Provider {
  /**
   * Lookup a list of users by ID.
   *
   * @param ctx
   * @param userIds list of userIDs
   */
  lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]>;

  /**
   * Given a Threat Model object, return a list of reviewers
   * that can review the model.
   *
   * @param ctx
   * @param model
   */
  getReviewersForModel(ctx: RequestContext, model: Model): Promise<Reviewer[]>;

  /**
   * Return all possible Reviewers
   * @param ctx
   */
  getReviewers(ctx: RequestContext): Promise<Reviewer[]>;

  /**
   * Return a fallback reviewer, used for e.g. reassignment.
   * @param ctx
   */
  getFallbackReviewer(ctx: RequestContext): Promise<Reviewer>;
}

export function setReviewerProvider(newReviewerProvider: ReviewerProvider) {
  reviewerProvider = newReviewerProvider;
}

export async function lookupReviewer(ctx: RequestContext, userId: string) {
  try {
    const result = await lookupReviewers(ctx, userId);
    if (!result || result.length === 0) {
      return null;
    }
    return result[0];
  } catch (err) {
    log.warn(`Errored while trying to look up reviewer: ${userId}`, err);
    return null;
  }
}

export async function lookupReviewers(ctx: RequestContext, ...userIds: string[]) {
  try {
    return await reviewerProvider.lookup(ctx, userIds);
  } catch (err) {
    log.warn(`Errored while trying to look up reviewers: ${userIds}`, err);
    return null;
  }
}

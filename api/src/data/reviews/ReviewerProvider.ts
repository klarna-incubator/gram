import { Reviewer } from "../../auth/models/Reviewer";
import { getLogger } from "../../logger";
import { Provider } from "../../util/provider";
import Model from "../models/Model";

class DefaultReviewerProvider implements ReviewerProvider {
  key = "default";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lookup(_userIds: string[]): Promise<Reviewer[]> {
    throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getReviewersForModel(_model: Model): Promise<Reviewer[]> {
    throw new Error("Method not implemented.");
  }

  getFallbackReviewer(): Promise<Reviewer> {
    throw new Error("Method not implemented.");
  }

  getReviewers(): Promise<Reviewer[]> {
    throw new Error("Method not implemented.");
  }
}

const log = getLogger("reviewerLookup");

export let reviewerProvider: ReviewerProvider = new DefaultReviewerProvider();

export interface ReviewerProvider extends Provider {
  lookup(userIds: string[]): Promise<Reviewer[]>;
  getReviewersForModel(model: Model): Promise<Reviewer[]>;
  getReviewers(): Promise<Reviewer[]>;
  getFallbackReviewer(): Promise<Reviewer>;
}

export function setReviewerProvider(newReviewerProvider: ReviewerProvider) {
  reviewerProvider = newReviewerProvider;
}

export async function lookupReviewer(userId: string) {
  try {
    const result = await lookupReviewers(userId);
    if (!result || result.length === 0) {
      return null;
    }
    return result[0];
  } catch (err) {
    log.warn(`Errored while trying to look up reviewer: ${userId}`, err);
    return null;
  }
}

export async function lookupReviewers(...userIds: string[]) {
  try {
    return await reviewerProvider.lookup(userIds);
  } catch (err) {
    log.warn(`Errored while trying to look up reviewers: ${userIds}`, err);
    return null;
  }
}

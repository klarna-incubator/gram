import { Reviewer } from "../auth/models/Reviewer";
import Model from "../data/models/Model";
import { RequestContext } from "../data/providers/RequestContext";
import { ReviewerProvider } from "../data/reviews/ReviewerProvider";
import { sampleOtherTeam, sampleTeam } from "./sampleTeam";

export const sampleReviewer: Reviewer = {
  sub: "reviewer@abc.xyz",
  mail: "reviewer@abc.xyz",
  name: "Reviewer",
  teams: [sampleOtherTeam],
  recommended: false,
};

export const sampleOtherReviewer: Reviewer = {
  sub: "other-reviewer@abc.xyz",
  mail: "other-reviewer@abc.xyz",
  name: "Other Reviewer",
  teams: [sampleTeam],
  recommended: false,
};

const reviewers = [sampleReviewer, sampleOtherReviewer];

class TestReviewerProvider implements ReviewerProvider {
  key = "test";
  async lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]> {
    return userIds
      .map((uid) => reviewers.find((u) => u.sub === uid))
      .filter((u) => u) as Reviewer[];
  }

  async getReviewersForModel(
    ctx: RequestContext,
    model: Model
  ): Promise<Reviewer[]> {
    return reviewers;
  }

  async getReviewers(): Promise<Reviewer[]> {
    return reviewers;
  }

  async getFallbackReviewer(): Promise<Reviewer> {
    return sampleOtherReviewer;
  }
}

export const testReviewerProvider = new TestReviewerProvider();

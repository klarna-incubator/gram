import { Reviewer } from "gram-api/src/auth/models/Reviewer";
import Model from "gram-api/src/data/models/Model";
import { RequestContext } from "gram-api/src//data/providers/RequestContext";
import { ReviewerProvider } from "gram-api/src//data/reviews/ReviewerProvider";

export const reviewers: Reviewer[] = [
  {
    name: "Joakim Uddholm",
    recommended: false,
    sub: "Tethik", // Must be the same as sub provided by AuthProvider for authz to work
    mail: "tethik@gmail.com",
    teams: [],
  },
  {
    name: "Security Team",
    recommended: true,
    sub: "tethik+securityteam@gmail.com",
    mail: "tethik+securityteam@gmail.com",
    teams: [],
  },
];

export class StaticReviewerProvider implements ReviewerProvider {
  async lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]> {
    return userIds
      .map((uid) => reviewers.find((r) => r.sub === uid))
      .filter((r) => !!r) as Reviewer[];
  }
  async getReviewersForModel(
    ctx: RequestContext,
    model: Model
  ): Promise<Reviewer[]> {
    return reviewers;
  }
  async getReviewers(ctx: RequestContext): Promise<Reviewer[]> {
    return reviewers;
  }
  async getFallbackReviewer(ctx: RequestContext): Promise<Reviewer> {
    return reviewers[1];
  }
  key: string = "static";
}

import { Reviewer } from "../../auth/models/Reviewer";
import Model from "../../data/models/Model";
import { ReviewerProvider } from "../../data/reviews/ReviewerProvider";

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
  async lookup(userIds: string[]): Promise<Reviewer[]> {
    return userIds
      .map((uid) => reviewers.find((r) => r.sub === uid))
      .filter((r) => !!r) as Reviewer[];
  }
  async getReviewersForModel(model: Model): Promise<Reviewer[]> {
    return reviewers;
  }
  async getReviewers(): Promise<Reviewer[]> {
    return reviewers;
  }
  async getFallbackReviewer(): Promise<Reviewer> {
    return reviewers[1];
  }
  key: string = "static";
}

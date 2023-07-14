import { UserProvider } from "@gram/core/dist/auth/UserProvider";
import { User } from "@gram/core/dist/auth/models/User";
import Model from "@gram/core/dist/data/models/Model";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";

export const users: User[] = [
  {
    name: "Joakim Uddholm",
    sub: "tethik@gmail.com", // Must be the same as sub provided by AuthProvider for authz to work
    mail: "tethik@gmail.com",
    teams: [],
  },
];

export class StaticUserProvider implements UserProvider {
  async lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    return userIds
      .map((uid) => users.find((r) => r.sub === uid))
      .filter((r) => !!r) as User[];
  }
  async getReviewersForModel(
    ctx: RequestContext,
    model: Model
  ): Promise<User[]> {
    return users;
  }
  async getReviewers(ctx: RequestContext): Promise<User[]> {
    return users;
  }
  async getFallbackReviewer(ctx: RequestContext): Promise<User> {
    return users[1];
  }
  key: string = "static";
}

import { Role } from "../auth/models/Role.js";
import { User } from "../auth/models/User.js";
import { UserToken } from "../auth/models/UserToken.js";
import { UserProvider } from "../auth/UserProvider.js";
import { RequestContext } from "../data/providers/RequestContext.js";
import { sampleOtherTeam, sampleTeam } from "./sampleTeam.js";

export const sampleUser: UserToken = {
  sub: "test@abc.xyz",
  roles: [Role.User],
  teams: [sampleTeam],
};

export const sampleOtherUser: UserToken = {
  sub: "other@abc.xyz",
  roles: [Role.User],
  teams: [sampleOtherTeam],
};

export const sampleReviewer: UserToken = {
  sub: "reviewer@abc.xyz",
  roles: [Role.Reviewer],
  teams: [sampleOtherTeam],
};

export const sampleAdmin: UserToken = {
  sub: "admin@abc.xyz",
  roles: [Role.Admin],
  teams: [{ name: "admin team", id: "1337" }],
};

const users = [sampleUser, sampleOtherUser, sampleReviewer, sampleAdmin];

class TestUserProvider implements UserProvider {
  key = "default";
  async lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    return userIds
      .map((uid) => users.find((u) => u.sub === uid))
      .filter((u) => u) as User[];
  }
}

export const testUserProvider = new TestUserProvider();

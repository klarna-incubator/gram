import { Role } from "../auth/models/Role";
import { User } from "../auth/models/User";
import { UserToken } from "../auth/models/UserToken";
import { UserProvider } from "../auth/UserProvider";
import { RequestContext } from "../data/providers/RequestContext";
import { sampleOtherTeam, sampleTeam } from "./sampleTeam";

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

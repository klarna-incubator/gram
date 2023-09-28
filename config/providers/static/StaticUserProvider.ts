import { UserProvider } from "@gram/core/dist/auth/UserProvider.js";
import { User } from "@gram/core/dist/auth/models/User.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";

export class StaticUserProvider implements UserProvider {
  constructor(public users: User[]) {}
  async lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    return userIds
      .map((uid) => this.users.find((r) => r.sub === uid))
      .filter((r) => !!r) as User[];
  }
  key: string = "static";
}

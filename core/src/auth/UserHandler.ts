import { RequestContext } from "../data/providers/RequestContext.js";
import { User } from "./models/User.js";
import { UserProvider } from "./UserProvider.js";

export class DummyUserProvider implements UserProvider {
  key = "default";
  lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    throw new Error(
      "Method not implemented. A UserProvider implementation is missing."
    );
  }
}

export class UserHandler {
  constructor() {}

  userProvider: UserProvider = new DummyUserProvider();

  setUserProvider(userProvider: UserProvider): void {
    this.userProvider = userProvider;
  }

  async lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    return this.userProvider.lookup(ctx, userIds);
  }

  async lookupUser(ctx: RequestContext, userId: string): Promise<User | null> {
    const users = await this.lookup(ctx, [userId]);
    if (!users || users.length === 0) {
      return null;
    }
    return users[0];
  }
}

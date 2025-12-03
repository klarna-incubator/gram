import { UserProvider } from "@gram/core/dist/auth/UserProvider.js";
import { User } from "@gram/core/dist/auth/models/User.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import log4js from "log4js";
import { getUserInfo } from "./util.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

const log = log4js.getLogger("OIDCUserProvider");

export interface OIDCUserProviderSettings {
  /**
   * Mapping function to convert OIDC user info to User object
   */
  userInfoToUser: (userInfo: any) => User;
}

export class OIDCUserProvider implements UserProvider {
  constructor(
    private dal: DataAccessLayer,
    public settings: OIDCUserProviderSettings
  ) {}

  async lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    const users = await Promise.all(userIds.map((uid) => this.getUser(uid)));
    return users.filter((u) => u).map((u) => u as User);
  }

  async getUser(userId: string): Promise<User | null> {
    const userInfo = await getUserInfo(this.dal, userId, log);

    if (!userInfo) {
      return null;
    }

    return this.settings.userInfoToUser(userInfo);
  }

  key = "oidc";
}

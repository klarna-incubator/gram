import { User } from "@gram/core/dist/auth/models/User";
import { UserProvider } from "@gram/core/dist/auth/UserProvider";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { getLogger } from "@gram/core/dist/logger";
import { getUser } from "./ldap/lookup";

const log = getLogger("KlarnaUserProvider");
export class KlarnaUserProvider implements UserProvider {
  key = "ldap";
  async lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    const users = (
      await Promise.all(userIds.map(async (uid) => await getUser(uid)))
    ).filter((u) => u) as User[];
    users.forEach((u) => log.debug(u));
    return users;
  }
}

import { User } from "gram-api/src/auth/models/User";
import { UserProvider } from "gram-api/src/auth/UserProvider";
import { RequestContext } from "gram-api/src/data/providers/RequestContext";
import { getLogger } from "gram-api/src/logger";
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

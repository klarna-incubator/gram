import { RequestContext } from "../data/providers/RequestContext";
import { getLogger } from "../logger";
import { User } from "./models/User";
import { UserProvider } from "./UserProvider";

class DefaultUserProvider implements UserProvider {
  key = "default";
  lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    throw new Error("Method not implemented.");
  }
}

const log = getLogger("userLookup");

export let userProvider: UserProvider = new DefaultUserProvider();
export function setUserProvider(newUserProvider: UserProvider) {
  userProvider = newUserProvider;
}

export async function lookupUser(
  ctx: RequestContext,
  sub: string
): Promise<User | null> {
  try {
    const result = await lookupUsers(ctx, [sub]);
    if (result.length === 0) return null;
    return result[0];
  } catch (err) {
    log.warn(`Errored while trying to look up user: ${sub}`, err);
    return null;
  }
}

export async function lookupUsers(
  ctx: RequestContext,
  subs: Array<string>
): Promise<User[]> {
  try {
    return await userProvider.lookup(ctx, subs);
  } catch (err) {
    log.warn(`Errored while trying to look up users: ${subs}`, err);
    return [];
  }
}

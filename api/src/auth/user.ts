import { getLogger } from "../logger";
import { User } from "./models/User";
import { UserProvider } from "./UserProvider";

class DefaultUserProvider implements UserProvider {
  key = "default";
  lookup(userIds: string[]): Promise<User[]> {
    throw new Error("Method not implemented.");
  }
}

const log = getLogger("userLookup");

export let userProvider: UserProvider = new DefaultUserProvider();
export function setUserProvider(newUserProvider: UserProvider) {
  userProvider = newUserProvider;
}

export async function lookupUser(sub: string): Promise<User | null> {
  try {
    const result = await lookupUsers([sub]);
    if (result.length === 0) return null;
    return result[0];
  } catch (err) {
    log.warn(`Errored while trying to look up user: ${sub}`, err);
    return null;
  }
}

export async function lookupUsers(subs: Array<string>): Promise<User[]> {
  try {
    return await userProvider.lookup(subs);
  } catch (err) {
    log.warn(`Errored while trying to look up users: ${subs}`, err);
    return [];
  }
}

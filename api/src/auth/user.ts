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

/**
 * Gets the accountable team a user belongs to.
 *
 * @param email
 * @returns {id: number, name: string}
 */
export async function lookupUser(email: string): Promise<User | null> {
  try {
    const result = await lookupUsers([email]);
    if (result.length === 0) return null;
    return result[0];
  } catch (err) {
    log.warn(`Errored while trying to look up user: ${email}`, err);
    return null;
  }
}

export async function lookupUsers(emails: Array<string>): Promise<User[]> {
  try {
    return await userProvider.lookup(emails);
  } catch (err) {
    log.warn(`Errored while trying to look up users: ${emails}`, err);
    return [];
  }
}

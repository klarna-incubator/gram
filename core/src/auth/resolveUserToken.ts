import type { DataAccessLayer } from "../data/dal.js";
import { RequestContext } from "../data/providers/RequestContext.js";
import { UserToken } from "./models/UserToken.js";

/**
 * resolveUserToken returns the [UserToken] for sub, with the roles and teams
 * of that user, or null if sub is not a known user.
 */
export async function resolveUserToken(
  dal: DataAccessLayer,
  ctx: RequestContext,
  sub: string
): Promise<UserToken | null> {
  const user = await dal.userHandler.lookupUser(ctx, sub);
  if (!user) {
    return null;
  }
  const roles = await dal.authzProvider.getRolesForUser(sub);
  const teams = await dal.teamHandler.getTeamsForUser(ctx, sub);
  return { ...user, sub, roles, teams };
}

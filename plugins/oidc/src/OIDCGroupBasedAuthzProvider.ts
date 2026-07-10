import { AuthzProvider } from "@gram/core/dist/auth/AuthzProvider.js";
import { DefaultAuthzProvider } from "@gram/core/dist/auth/DefaultAuthzProvider.js";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import log4js from "log4js";
import { getUserInfo } from "./util.js";

const log = log4js.getLogger("OIDCGroupBasedAuthzProvider");

export interface OIDCAuthzProviderSettings {
  groupsClaimName: string;
  groupToRoleMap: Map<string, Role>;
}

/**
 * An AuthzProvider that uses OIDC group claims from cached authentication
 * to determine user roles.
 */
export class OIDCGroupBasedAuthzProvider
  extends DefaultAuthzProvider
  implements AuthzProvider
{
  constructor(
    dal: DataAccessLayer,
    public settings: OIDCAuthzProviderSettings
  ) {
    super(dal);
  }

  async getRolesForUser(sub: string): Promise<Role[]> {
    const userInfo = await getUserInfo(this.dal, sub, log);

    if (!userInfo || !userInfo.groups) {
      return [];
    }

    return this.mapGroupsToRoles(userInfo.groups);
  }

  private mapGroupsToRoles(groups: string[]): Role[] {
    const roles = groups
      .map((group) => this.settings.groupToRoleMap.get(group))
      .filter((role): role is Role => role !== undefined);

    log.debug(`Mapped groups to roles:`, { groups, roles });
    return roles;
  }

  key = "oidc-group";
}

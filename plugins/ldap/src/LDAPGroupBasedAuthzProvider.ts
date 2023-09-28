import { AuthzProvider } from "@gram/core/dist/auth/AuthzProvider.js";
import { DefaultAuthzProvider } from "@gram/core/dist/auth/DefaultAuthzProvider.js";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import { LDAPClientSettings } from "./LDAPClientSettings.js";
import { connectLdapClient, ldapQueryOne } from "./lookup.js";
import { escapeFilterValue, getAttributeAsArray } from "./util.js";

export interface LDAPAuthzProviderSettings {
  ldapSettings: LDAPClientSettings;
  searchBase: string;
  searchFilter: (sub: string) => string;
  groupAttribute: string;
  groupToRoleMap: Map<string, Role>;
}

/**
 * An AuthzProvider that uses LDAP to lookup the roles for a user based on the groups they are a member of.
 *
 * Groups are fetched from a specified attribute.
 */
export class LDAPGroupBasedAuthzProvider
  extends DefaultAuthzProvider
  implements AuthzProvider
{
  constructor(public settings: LDAPAuthzProviderSettings) {
    super();
  }

  async getRolesForUser(sub: string): Promise<Role[]> {
    const escapedUserId = escapeFilterValue(sub);
    const ldap = await connectLdapClient(this.settings.ldapSettings);

    try {
      const object = await ldapQueryOne(ldap, this.settings.searchBase, {
        scope: "sub",
        filter: this.settings.searchFilter(escapedUserId),
        attributes: [this.settings.groupAttribute],
      });

      if (!object) {
        return [];
      }

      const arr = getAttributeAsArray(object, this.settings.groupAttribute);
      const groups = arr.map((a) => a.toString());

      const roles = groups
        .map((g) => this.settings.groupToRoleMap.get(g))
        .filter((r) => r) as Role[];

      return roles;
    } finally {
      await ldap.unbind();
    }
  }

  key = "ldap-group";
}

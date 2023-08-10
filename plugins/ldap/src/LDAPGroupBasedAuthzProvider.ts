import { AuthzProvider } from "@gram/core/dist/auth/AuthzProvider";
import { DefaultAuthzProvider } from "@gram/core/dist/auth/DefaultAuthzProvider";
import { Role } from "@gram/core/dist/auth/models/Role";
import { LDAPClientSettings } from "./LDAPClientSettings";
import { connectLdapClient, ldapQueryOne } from "./lookup";
import { getAttributeAsArray } from "./util";

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
    const ldap = await connectLdapClient(this.settings.ldapSettings);

    const object = await ldapQueryOne(ldap, this.settings.searchBase, {
      scope: "sub",
      filter: this.settings.searchFilter(sub),
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
  }

  key = "ldap-group";
}

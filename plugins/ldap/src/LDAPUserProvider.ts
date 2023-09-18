import { UserProvider } from "@gram/core/dist/auth/UserProvider";
import { User } from "@gram/core/dist/auth/models/User";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { Entry } from "ldapts";
import { getLogger } from "log4js";
import { LDAPClientSettings } from "./LDAPClientSettings";
import { connectLdapClient, ldapQueryOne } from "./lookup";

export interface LDAPUserProviderSettings {
  ldapSettings: LDAPClientSettings;
  searchBase: string;
  searchFilter: (sub: string) => string;
  attributes: string[];
  attributesToUser: (ldapUser: Entry) => Promise<User>;
}

const log = getLogger("LDAPUserProvider");

export class LDAPUserProvider implements UserProvider {
  constructor(public settings: LDAPUserProviderSettings) {}

  async lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    const users = (
      await Promise.all(userIds.map(async (uid) => await this.getUser(uid)))
    ).filter((u) => u) as User[];
    users.forEach((u) => log.info(u));
    return users;
  }

  async getUser(email: string): Promise<User | null> {
    const ldap = await connectLdapClient(this.settings.ldapSettings);

    const ldapUser = await ldapQueryOne(ldap, this.settings.searchBase, {
      scope: "sub",
      filter: this.settings.searchFilter(email),
      attributes: this.settings.attributes,
    });

    if (ldapUser === null) return null;

    const user = await this.settings.attributesToUser(ldapUser);
    return user;
  }

  key = "ldap";
}

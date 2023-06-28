import config from "config";
import { getLogger } from "@gram/core/dist/logger";
import { User } from "@gram/core/dist/auth/models/User";
import { Team } from "@gram/core/dist/auth/models/Team";
import { LDAPTeamSearchBase, LDAPUserSearchBase } from "./config";
import Cache from "@gram/core/dist/util/cache";
import secrets from "@gram/core/dist/secrets";
import { Client, Entry, SearchOptions, SearchResult } from "ldapts";

const log = getLogger("ldapLookup");

export async function initLdapClient() {
  const client = new Client({
    url: config.get("auth.providerOpts.ldap.url"),
    timeout: 30000,
    connectTimeout: 30000,
    tlsOptions: {
      minVersion: "TLSv1.2",
    },
    strictDN: true,
  });

  return client;
}

export async function connectLdapClient() {
  const client = await initLdapClient();
  const bindDN = await secrets.get("auth.providerOpts.ldap.bindDN");
  const bindCredentials = await secrets.get(
    "auth.providerOpts.ldap.bindCredentials"
  );

  await client.bind(bindDN, bindCredentials);
  return client;
}

export async function testLdapClient() {
  // Checking that ldap works
  const user = await getUser("joakim.uddholm@klarna.com");
  if (!user) {
    throw new Error(
      "LDAP failed to lookup sys.gram.ldap user, likely something is wrong with the LDAP setup"
    );
  }
}

export type LDAPUser = {
  dn: string;
  sub: string;
  name: string;
  teams: string[];
};

export type LDAPDomain = {
  cn: string;
  name: string;
  memberCns: string[];
};

function getAttribute(ldapObj: Entry, name: string) {
  return ldapObj[name] ? ldapObj[name].toString() : "";
}

function getAttributeAsArray(ldapObj: Entry, name: string) {
  const attr = ldapObj[name];
  if (typeof attr == "string") {
    return [attr];
  }
  if (attr instanceof Buffer) {
    return [attr.toString()];
  }
  return attr ? attr.map((a: Buffer | string) => a.toString()) : [];
}

export async function getLDAPUserGroupsByDN(dn: string): Promise<string[]> {
  const object = await ldapQueryOne(dn, {
    scope: "sub",
    attributes: ["memberOfGroupId"],
  });

  if (!object) {
    return [];
  }

  const arr = getAttributeAsArray(object, "memberOfGroupId");
  return arr.map((a) => a.toString());
}

export async function getLDAPUserGroups(email: string): Promise<string[]> {
  if (email === "root") {
    return [];
  }

  const idx = email.indexOf("@klarna.com");
  if (idx < 0) {
    return [];
  }
  const uid = email.substring(0, idx);

  const object = await ldapQueryOne(LDAPUserSearchBase, {
    scope: "sub",
    filter: `(&(uid=${uid})(kreditorEnabledUser=TRUE))`,
    attributes: ["dn", "memberOfGroupId"],
  });

  if (!object) {
    return [];
  }

  const arr = getAttributeAsArray(object, "memberOfGroupId");
  return arr.map((a) => a.toString());
}

export async function listLDAPGroupMembers(
  groupId: string
): Promise<LDAPUser[]> {
  const result = await ldapQuery(LDAPUserSearchBase, {
    scope: "sub",
    filter: `(&(memberOfGroupId=${groupId})(kreditorEnabledUser=TRUE))`,
    attributes: ["displayName", "mail", "klarnaAccountabilityOU", "dn"],
  });

  if (result === null) return [];

  return result.searchEntries.map((s: Entry) => ({
    dn: s.dn,
    sub: getAttribute(s, "mail"),
    name: getAttribute(s, "displayName"),
    teams: getAttributeAsArray(s, "klarnaAccountabilityOU"),
  }));
}

export async function getTeamsByCN(cns: string[]): Promise<Team[]> {
  const teams = await Promise.all(
    cns.filter((cn) => cn).map(async (cn) => getTeamByCN(cn))
  );
  return teams.filter((t) => t) as Team[];
}

export async function getTeamByQuery(
  base: string,
  options: SearchOptions
): Promise<Team | null> {
  const object = await ldapQueryOne(base, options);

  if (object === null) return null;

  const team: Team = {
    id: getAttribute(object, "klarnaProjectCode"),
    name: getAttribute(object, "displayName"),
  };

  // Some klarnaAccountabiltiyOUs return empty attributes here.
  if (team.id === null || team.name === null) {
    return null;
  }

  return team;
}

export async function getTeamByCN(cn: string) {
  // Might be an obtuse vulnerability here if you can manage to inject into the CN passed here.
  // The risk seems pretty low, as you'd need to currently create a new team in LDAP with your injection code
  // as the CN and then there's not much you can get out of the actual query here. LDAP is already public.
  // Worst I can think of is somehow bypassing authz, but it seems very hard to do.
  // So I'll leave it for now. //Joakim
  return getTeamByQuery(cn, {
    scope: "sub",
    // attributes: ["displayName", "klarnaProjectCode", "mail"],
  });
}

export async function getTeam(klarnaProjectCode: string): Promise<Team | null> {
  return getTeamByQuery(LDAPTeamSearchBase, {
    scope: "sub",
    filter: `(klarnaProjectCode=${klarnaProjectCode})`,
    attributes: ["displayName", "klarnaProjectCode", "mail", "dn"],
  });
}

export async function getUser(email: string): Promise<User | null> {
  if (email === "root") {
    return {
      sub: "root",
      mail: "root",
      name: "root",
      teams: [],
    };
  }

  const ldapUser = await ldapQueryOne(LDAPUserSearchBase, {
    scope: "sub",
    filter: `(&(mail=${email})(kreditorEnabledUser=TRUE))`,
    attributes: ["displayName", "mail", "klarnaAccountabilityOU"],
  });

  if (ldapUser === null) return null;

  const ldapTeams = getAttributeAsArray(ldapUser, "klarnaAccountabilityOU");
  const teams = await getTeamsByCN(ldapTeams);

  const user: User = {
    sub: getAttribute(ldapUser, "mail"),
    mail: getAttribute(ldapUser, "mail"),
    name: getAttribute(ldapUser, "displayName"),
    teams,
  };
  return user;
}

export async function getDomain(
  klarnaProjectCode: string
): Promise<LDAPDomain | null> {
  const object = await ldapQueryOne(LDAPTeamSearchBase, {
    scope: "sub",
    filter: `(klarnaProjectCode=${klarnaProjectCode})`,
    // attributes: ["displayName", "uniqueMember"],
  });

  if (object === null) return null;

  const domain: LDAPDomain = {
    cn: object.objectName as string,
    name: getAttribute(object, "displayName"),
    memberCns: getAttributeAsArray(object, "uniqueMember"),
  };
  return domain;
}

const TWENTY_MINS_MS = 20 * 60 * 1000;
export const LDAPCache = new Cache<string, SearchResult>(
  "LDAP-cache",
  TWENTY_MINS_MS
);

async function ldapQuery(
  base: string,
  options: SearchOptions
): Promise<SearchResult> {
  const cacheKey = JSON.stringify({ base, options });
  if (LDAPCache.has(cacheKey)) {
    log.debug("Cache hit LDAP lookup for", cacheKey);
    return LDAPCache.get(cacheKey) as SearchResult;
  }

  log.debug("Cache miss LDAP lookup for", cacheKey);

  // any here as a temporary workaround until types are updated.
  const ldapClient: Client = await connectLdapClient();
  const results = await ldapClient.search(base, options);
  await ldapClient.unbind();
  return results;
}

async function ldapQueryOne(
  base: string,
  options: SearchOptions
): Promise<Entry | null> {
  const objects = await ldapQuery(base, options);

  if (objects.searchEntries.length === 0) {
    return null;
  }

  if (objects.searchEntries.length > 1) {
    log.warn(
      `Lookup of ldap objects returned more than one item. The first result will be used`
    );
  }

  return objects.searchEntries[0];
}

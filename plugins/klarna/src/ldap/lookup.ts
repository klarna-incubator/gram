import ldap from "ldapjs";
import config from "config";
import { getLogger } from "@gram/core/dist/logger";
import { User } from "@gram/core/dist/auth/models/User";
import { Team } from "@gram/core/dist/auth/models/Team";
import { LDAPTeamSearchBase, LDAPUserSearchBase } from "./config";
import Cache from "@gram/core/dist/util/cache";
import secrets from "@gram/core/dist/secrets";
import { Client } from "ldapjs";

const log = getLogger("ldapLookup");

export async function initLdapClient() {
  const ldapClient = ldap.createClient({
    url: [config.get("auth.providerOpts.ldap.url")],
    reconnect: true,
    timeout: 30000,
    connectTimeout: 30000,
    log: log,
  });

  ldapClient.on("error", (err) => {
    log.error("ldap error", err);
  });

  ldapClient.on("connectError", (err) => {
    log.error("ldap connectError", err);
  });

  return ldapClient;
}

async function connectLdapClient() {
  const bindDN = await secrets.get("auth.providerOpts.ldap.bindDN");
  const bindCredentials = await secrets.get(
    "auth.providerOpts.ldap.bindCredentials"
  );

  const ldapClient = await initLdapClient();

  return new Promise<Client>((resolve, reject) =>
    ldapClient.bind(bindDN, bindCredentials, (err) => {
      if (err) {
        log.error("Encountered error while binding", err);
        return reject(err);
      }

      log.debug("Bind was successful");

      resolve(ldapClient);
    })
  );
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

function getAttribute(ldapObj: any, name: string) {
  const attribute = ldapObj.attributes.find((a: any) => a.type === name);

  if (attribute && attribute.values && attribute.values.length > 0) {
    return attribute.values[0];
  }
  return null;
}

function getAttributeAsArray(ldapObj: any, name: string) {
  const attribute = ldapObj.attributes.find((a: any) => a.type === name);
  if (attribute && attribute.values) {
    return attribute.values;
  }
  return [];
}

export async function getLDAPUserGroupsByDN(dn: string): Promise<string[]> {
  const object = await ldapQueryOne(dn, {
    scope: "sub",
    attributes: ["memberOfGroupId"],
  });

  return object !== null ? getAttributeAsArray(object, "memberOfGroupId") : [];
}

export async function getLDAPUserGroups(email: string): Promise<string[]> {
  const idx = email.indexOf("@klarna.com");
  if (idx < 0) {
    return [];
  }
  const uid = email.substring(0, idx);

  const object = await ldapQueryOne(LDAPUserSearchBase, {
    scope: "sub",
    filter: `(uid=${uid})`,
    attributes: ["dn", "memberOfGroupId"],
  });

  return object !== null ? getAttributeAsArray(object, "memberOfGroupId") : [];
}

export async function listLDAPGroupMembers(
  groupId: string
): Promise<LDAPUser[]> {
  const objects = await ldapQuery(LDAPUserSearchBase, {
    scope: "sub",
    filter: `(memberOfGroupId=${groupId})`,
    attributes: ["displayName", "mail", "klarnaAccountabilityOU", "dn"],
  });

  if (objects === null) return [];

  return objects.map((s: any) => ({
    dn: s.objectName,
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
  options: ldap.SearchOptions
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
  const ldapUser = await ldapQueryOne(LDAPUserSearchBase, {
    scope: "sub",
    filter: `(mail=${email})`,
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
export const LDAPCache = new Cache<string, ldap.SearchEntryObject[]>(
  "LDAP-cache",
  TWENTY_MINS_MS
);

async function ldapQuery(
  base: string,
  options: ldap.SearchOptions
): Promise<ldap.SearchEntryObject[] | null> {
  const cacheKey = JSON.stringify({ base, options });
  if (LDAPCache.has(cacheKey)) {
    log.debug("Cache hit LDAP lookup for", cacheKey);
    return LDAPCache.get(cacheKey);
  }

  log.debug("Cache miss LDAP lookup for", cacheKey);

  // any here as a temporary workaround until types are updated.
  const ldapClient: any = await connectLdapClient();

  const promise = new Promise<ldap.SearchEntryObject[] | null>(
    (resolve, reject) => {
      const objects: ldap.SearchEntryObject[] = [];

      ldapClient.search(base, options, (err: any, res: any) => {
        if (err) {
          log.error("Error occured in search", err);
          reject(err);
          return;
        }

        res.on("searchEntry", (entry: any) => {
          if (entry.pojo) {
            objects.push(entry.pojo);
          } else {
            log.warn("got non-truthy LDAP entry object", cacheKey, entry.pojo);
          }
        });

        res.on("error", (err: any) => {
          log.error("Error during LDAP query", err);
          reject(err);
        });

        res.on("end", (result: any) => {
          log.debug("ldap end");
          LDAPCache.set(cacheKey, objects);
          ldapClient.unbind();
          resolve(objects);
        });
      });
    }
  );

  const result = await promise;
  ldapClient.destroy();
  if (result === null) {
    throw new Error(
      `Got a null result from LDAP, meaning the promise was never resolved. Query: ${cacheKey}`
    );
  }
  if (result?.length === 0) {
    log.warn("received an empty result", cacheKey, result);
  }
  return result;
}

async function ldapQueryOne(
  base: string,
  options: ldap.SearchOptions
): Promise<ldap.SearchEntryObject | null> {
  const objects = await ldapQuery(base, options);

  if (objects === null || objects.length === 0) {
    return null;
  }

  if (objects.length > 1) {
    log.warn(
      `Lookup of ldap objects returned more than one item. The first result will be used`
    );
  }

  return objects[0];
}

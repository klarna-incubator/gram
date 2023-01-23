import ldap from "ldapjs";
import config from "config";
import { getLogger } from "gram-api/src/logger";
import { User } from "gram-api/src/auth/models/User";
import { Team } from "gram-api/src/auth/models/Team";
import { LDAPTeamSearchBase, LDAPUserSearchBase } from "./config";
import Cache from "gram-api/src/util/cache";
import secrets from "gram-api/src/secrets";
import { Client } from "ldapjs";

const log = getLogger("ldapLookup");

export async function initLdapClient() {
  const ldapClient = ldap.createClient({
    url: [config.get("auth.providerOpts.ldap.url")],
    reconnect: true,
    timeout: 5000,
    connectTimeout: 5000,
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
        return reject(err);
      }

      resolve(ldapClient);
    })
  );
}

export async function testLdapClient() {
  // Checking that ldap works
  const user = await getUser("sys.gram.ldap@klarna.com");
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

export async function getLDAPUserGroupsByDN(dn: string): Promise<string[]> {
  const object = await ldapQueryOne(dn, {
    scope: "sub",
    attributes: ["memberOfGroupId"],
  });

  return object !== null ? (object.memberOfGroupId as string[]) : [];
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

  return object !== null ? (object.memberOfGroupId as string[]) : [];
}

export async function listLDAPGroupMembers(
  groupId: string
): Promise<LDAPUser[]> {
  const objects = await ldapQuery(LDAPUserSearchBase, {
    scope: "sub",
    filter: `(memberOfGroupId=${groupId})`,
    attributes: ["displayName", "mail", "klarnaAccountabilityOU"],
  });

  if (objects === null) return [];

  return objects.map((s) => ({
    dn: s.dn as string,
    sub: s.mail as string,
    name: s.displayName as string,
    teams: Array.isArray(s.klarnaAccountabilityOU)
      ? s.klarnaAccountabilityOU
      : [s.klarnaAccountabilityOU],
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
    id: object.klarnaProjectCode as string,
    name: object.displayName as string,
  };

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

  const ldapTeams = Array.isArray(ldapUser.klarnaAccountabilityOU)
    ? ldapUser.klarnaAccountabilityOU
    : [ldapUser.klarnaAccountabilityOU];

  const teams = await getTeamsByCN(ldapTeams);

  const user: User = {
    sub: ldapUser.mail as string,
    mail: ldapUser.mail as string,
    name: ldapUser.displayName as string,
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
    cn: object.cn as string,
    name: object.displayName as string,
    memberCns: object.uniqueMember as string[],
  };
  return domain;
}

const THIRTY_MINS_MS = 30 * 60 * 1000;
export const LDAPCache = new Cache<string, ldap.SearchEntryObject[]>(
  "LDAP-cache",
  THIRTY_MINS_MS
);

async function ldapQuery(
  base: string,
  options: ldap.SearchOptions
): Promise<ldap.SearchEntryObject[] | null> {
  const cacheKey = JSON.stringify({ base, options });

  if (LDAPCache.has(cacheKey)) {
    log.debug("Cache hit LDAP lookup for", cacheKey);
    return LDAPCache.get(cacheKey);
  } else {
    log.debug("Cache miss LDAP lookup for", cacheKey);
  }

  const ldapClient = await connectLdapClient();

  const promise = new Promise<ldap.SearchEntryObject[] | null>(
    (resolve, reject) => {
      const objects: ldap.SearchEntryObject[] = [];

      // console.log(base, options);
      ldapClient.search(base, options, (err, res) => {
        if (err) return reject(err);

        res.on("searchEntry", (entry) => {
          log.debug("entry.object", entry.object);
          if (entry.object && entry.object?.dn) {
            objects.push(entry.object);
          } else {
            log.warn(
              "got non-truthy LDAP entry object",
              cacheKey,
              entry.object
            );
          }
        });

        res.on("error", (err) => {
          log.error("Error during LDAP query", err);
          reject(err);
        });

        res.on("end", () => {
          LDAPCache.set(cacheKey, objects);
          ldapClient.unbind();
          resolve(objects);
        });
      });
    }
  );

  const result = await promise;
  ldapClient.destroy();
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

import Cache from "@gram/core/dist/util/cache";
import { Client, Entry, SearchOptions, SearchResult } from "ldapts";
import { getLogger } from "log4js";
import { LDAPClientSettings } from "./LDAPClientSettings";

const log = getLogger("ldapLookup");

export async function initLdapClient(ldapSettings: LDAPClientSettings) {
  const client = new Client({
    /**
     * Some default settings that are recommended for production use.
     */
    timeout: 30000,
    connectTimeout: 30000,
    tlsOptions: {
      minVersion: "TLSv1.2",
    },
    strictDN: true,

    ...ldapSettings.clientOptions,
  });

  return client;
}

export async function connectLdapClient(ldapSettings: LDAPClientSettings) {
  const client = await initLdapClient(ldapSettings);

  const bindDN = await ldapSettings.bindOptions?.bindDN.getValue();
  const bindCredentials =
    await ldapSettings.bindOptions?.bindCredentials.getValue();

  if (bindDN && bindCredentials) {
    await client.bind(bindDN, bindCredentials);
  }
  return client;
}

const TWENTY_MINS_MS = 20 * 60 * 1000;
export const LDAPCache = new Cache<string, SearchResult>(
  "LDAP-cache",
  TWENTY_MINS_MS
);

export async function ldapQuery(
  ldapClient: Client,
  base: string,
  options: SearchOptions
): Promise<SearchResult> {
  const cacheKey = JSON.stringify({ base, options });
  if (LDAPCache.has(cacheKey)) {
    log.debug("Cache hit LDAP lookup for", cacheKey);
    return LDAPCache.get(cacheKey) as SearchResult;
  }

  log.debug("Cache miss LDAP lookup for", cacheKey);

  const results = await ldapClient.search(base, options);
  await ldapClient.unbind();
  return results;
}

export async function ldapQueryOne(
  ldapClient: Client,
  base: string,
  options: SearchOptions
): Promise<Entry | null> {
  const objects = await ldapQuery(ldapClient, base, options);

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

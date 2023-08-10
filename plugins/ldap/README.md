# README

Plugin for different providers using LDAP. Warning: these may require some extra configuration/code to work with your LDAP server.

- **LDAPBasicAuthIdentityProvider** - Adds a new identity provider which gets credentials from basic auth and attempts to do an LDAP bind.
- **LDAPGroupBasedAuthzProvider** - Performs lookups on logged in users and maps roles via groups.
- **LDAPUserProvider** - Uses LDAP to provide information on users.

## Configuration

Add the `@gram/ldap` package to your config.

```sh
npm -w config i @gram/ldap
```

In order to have the cache cleared, you may want to add an interval:

```ts
setInterval(() => LDAPCache.expire(), CACHE_EXPIRY_INTERVAL_MS);
```

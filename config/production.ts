import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { LDAPUserSearchBase, defaultConfig, ldapSettings } from "./default.js";
import { HSFContextProvider } from "@gram/klarna";
import { ThreatsaurusSuggestionSource } from "@gram/threatsaurus";
import { LDAPGroupBasedAuthzProvider } from "@gram/ldap";
import { Role } from "@gram/core/dist/auth/models/Role.js";

export const productionConfig: GramConfiguration = {
  ...defaultConfig,

  // Update this to your domain
  origin: "https://gram.klarna.net",

  sentryDSN:
    "https://7755cd2515424f6cbcef6a4d43e54fdb@o24547.ingest.sentry.io/6023867",

  httpsProxy: process.env.HTTPS_PROXY,

  async bootstrapProviders(dal) {
    const providers = await defaultConfig.bootstrapProviders(dal);

    const hsf = {
      bucket: "secdev-qliksense-exporter-production-source",
      key: "hsf-systems-daily.csv",
      awsRole:
        "arn:aws:iam::715798949107:role/iam-sync/gram/c2c/gram/eu/production/gram.c2c_gram",
      awsExternalId: "e2105a81-0156-4321-b757-4e3f20aaacac",
    };

    const hsfProvider = new HSFContextProvider(
      hsf.bucket,
      hsf.key,
      hsf.awsRole,
      hsf.awsExternalId
    );

    providers.systemPropertyProviders?.push(hsfProvider);

    const threatsaurus = new ThreatsaurusSuggestionSource(
      "https://threatsaurus-eu.production.c2c.klarna.net/v1/"
    );

    providers.suggestionSources?.push(threatsaurus);

    // Fix LDAP Access Groups used by production
    const ldapAuthz = new LDAPGroupBasedAuthzProvider({
      ldapSettings,
      groupAttribute: "memberOfGroupId",
      groupToRoleMap: new Map([
        ["access.1288598.prod.admins", Role.Admin],
        ["domain.security.leads", Role.Admin],
        ["access.1288598.prod.reviewers", Role.Reviewer],
        ["security-champions", Role.Reviewer],
        ["access.1288598.prod.users", Role.User],
        ["access.1288598.prod.sso-prod", Role.User],
      ]),
      searchBase: LDAPUserSearchBase,
      searchFilter: (sub: string) => {
        return `(&(mail=${sub})(kreditorEnabledUser=TRUE))`;
      },
    });

    providers.authzProvider = ldapAuthz;

    return providers;
  },
};

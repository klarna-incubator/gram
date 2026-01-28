import { Role } from "@gram/core/dist/auth/models/Role.js";
import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { LDAPGroupBasedAuthzProvider } from "@gram/ldap";
import { LDAPUserSearchBase, ldapSettings } from "./default.js";
import { defaultConfig } from "./default.js";
import { createJiraActionItemExporter } from "./jira.js";
import { WikibaseActionItemExporter } from "@gram/wikibase/dist/index.js";

export const productionConfig: GramConfiguration = {
  ...defaultConfig,

  // Update this to your domain
  origin: "https://gram.klarna.net",

  sentryDSN:
    "https://7755cd2515424f6cbcef6a4d43e54fdb@o24547.ingest.sentry.io/6023867",

  httpsProxy: process.env.HTTPS_PROXY,

  async bootstrapProviders(dal) {
    const providers = await defaultConfig.bootstrapProviders(dal);

    // Fix LDAP Access Groups used by production
    const ldapAuthz = new LDAPGroupBasedAuthzProvider(dal, {
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

    const jiraActionItemExporter = createJiraActionItemExporter(
      this,
      dal,
      "production",
    );
    const wikibaseActionItemExporter = new WikibaseActionItemExporter(dal);

    providers.actionItemExporters = [
      jiraActionItemExporter,
      wikibaseActionItemExporter,
    ];

    return providers;
  },
};

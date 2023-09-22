import cron from "node-cron";
import { AWSAssets, AWSComponentClasses } from "@gram/aws";
import { Role } from "@gram/core/dist/auth/models/Role";
import { User } from "@gram/core/dist/auth/models/User";
import { EnvSecret } from "@gram/core/dist/config/EnvSecret";
import type {
  GramConfiguration,
  Providers,
} from "@gram/core/dist/config/GramConfiguration";
import type { DataAccessLayer } from "@gram/core/dist/data/dal";
import {
  LDAPBasicAuthIdentityProvider,
  LDAPCache,
  LDAPGroupBasedAuthzProvider,
  LDAPTeamProvider,
  LDAPUserProvider,
} from "@gram/ldap";
import { OIDCIdentityProvider } from "@gram/oidc";
import { SVGPornAssets, SVGPornComponentClasses } from "@gram/svgporn";
import { ThreatLibSuggestionProvider } from "@gram/threatlib";
import { LDAPClientSettings } from "@gram/ldap/dist/LDAPClientSettings";
import defaultNotifications from "./notifications";
import {
  KlarnaReviewerProvider,
  OctaneSystemProvider,
  NGOVSystemContextProvider,
  HSFContextProvider,
  KlarnaCronJob,
} from "@gram/klarna";
import { Reviewer } from "@gram/core/dist/auth/models/Reviewer";

const LDAPUserSearchBase = "ou=People,dc=internal,dc=machines";
const LDAPTeamSearchBase = "ou=Klarna,dc=internal,dc=machines";

export const defaultConfig: GramConfiguration = {
  appPort: 8080,
  controlPort: 8081,
  origin: "http://localhost:4726",

  jwt: {
    ttl: 86400,
    secret: {
      auth: new EnvSecret("AUTH_SECRET"),
    },
  },

  postgres: {
    host: new EnvSecret("POSTGRES_HOST"),
    user: new EnvSecret("POSTGRES_USER"),
    password: new EnvSecret("POSTGRES_PASSWORD"),
    database: new EnvSecret("POSTGRES_DATABASE"),
    port: new EnvSecret("POSTGRES_PORT"),
    ssl: true,
  },

  notifications: {
    providers: {
      email: {
        host: new EnvSecret("EMAIL_HOST"),
        port: new EnvSecret("EMAIL_PORT"),
        password: new EnvSecret("EMAIL_PASSWORD"),
        user: new EnvSecret("EMAIL_USER"),
      },
    },
  },

  log: {
    layout: "json",
    level: "info",
    auditHttp: {
      excludeKeys: {
        header: ["authorization", "cookie"],
        body: ["token"],
      },
      includeKeys: {
        header: ["user-agent", "host", "referer", "cache-control", "pragma"],
      },
      simplified: false,
    },
  },

  allowedSrc: {
    img: ["https:"],
    connect: [],
  },

  menu: [
    {
      name: "Github",
      path: "https://github.com/klarna-incubator/gram",
    },
  ],

  bootstrapProviders: async function (
    dal: DataAccessLayer
  ): Promise<Providers> {
    const oidc = new OIDCIdentityProvider(
      "https://klarna-dev-admin.oktapreview.com/",
      new EnvSecret("OIDC_CLIENT_ID"),
      new EnvSecret("OIDC_CLIENT_SECRET"),
      new EnvSecret("OIDC_SESSION_SECRET"),
      "email"
    );

    const ldapSettings: LDAPClientSettings = {
      clientOptions: {
        url: "ldaps://ldap.klarna.net",
      },
      bindOptions: {
        bindDN: new EnvSecret("LDAP_BIND_DN"),
        bindCredentials: new EnvSecret("LDAP_BIND_CREDENTIALS"),
      },
    };

    const ldap = new LDAPBasicAuthIdentityProvider(
      ldapSettings,
      (name) => `uid=${name},ou=People,dc=internal,dc=machines`
    );

    const ldapAuthz = new LDAPGroupBasedAuthzProvider({
      ldapSettings,
      groupAttribute: "memberOfGroupId",
      groupToRoleMap: new Map([
        ["access.1288598.stag.admins", Role.Admin],
        ["domain.security.leads", Role.Admin],
        ["access.1288598.stag.reviewers", Role.Reviewer],
        ["security-champions", Role.Reviewer],
        ["access.1288598.stag.users", Role.User],
        ["access.1288598.stag.sso-prod", Role.User],
      ]),
      searchBase: LDAPUserSearchBase,
      searchFilter: (sub) => {
        return `(&(mail=${sub})(kreditorEnabledUser=TRUE))`;
      },
    });

    const ldapUserProvider = new LDAPUserProvider({
      ldapSettings,
      searchBase: LDAPUserSearchBase,
      searchFilter: (sub) => {
        return `(&(mail=${sub})(kreditorEnabledUser=TRUE))`;
      },
      attributes: ["displayName", "mail", "klarnaAccountabilityOU"],
      attributesToUser: async (ldapUser) => {
        const user: User = {
          sub: ldapUser["mail"].toString(),
          mail: ldapUser["mail"].toString(),
          name: ldapUser["displayName"].toString(),
        };
        return user;
      },
    });

    const ldapTeamProvider = new LDAPTeamProvider({
      ldapSettings,
      teamLookup: {
        attributes: ["displayName", "klarnaProjectCode", "mail", "dn"],
        attributesToTeam: async (ldapEntry) => ({
          id: ldapEntry["klarnaProjectCode"].toString(),
          name: ldapEntry["displayName"].toString(),
          email: ldapEntry["mail"].toString(),
        }),
        searchBase: LDAPTeamSearchBase,
        searchFilter: (teamIds) => {
          return `(|${teamIds.map(
            (teamId) => `(klarnaProjectCode=${teamId})`
          )})`;
        },
      },
      userLookup: {
        searchBase: LDAPUserSearchBase,
        searchFilter: (sub) => {
          return `(&(mail=${sub})(kreditorEnabledUser=TRUE))`;
        },
        teamAttribute: "klarnaProjectCode",
      },
    });

    const systemProvider = new OctaneSystemProvider();

    // Will used mocked data when supplied empty params
    const hsfProvider = new HSFContextProvider("", "", "", "");

    const ngovProvider = new NGOVSystemContextProvider(systemProvider);

    const reviewerProvider = new KlarnaReviewerProvider(
      dal,
      systemProvider,
      hsfProvider,
      {
        groupLookup: {
          searchBase: LDAPUserSearchBase,
          groupFilters: [
            "(&(memberOfGroupId=access.secure-development)(kreditorEnabledUser=TRUE))",
            "(&(memberOfGroupId=domain.security.leads)(kreditorEnabledUser=TRUE))",
            "(&(memberOfGroupId=access.1288598.stag.reviewers)(kreditorEnabledUser=TRUE))",
            "(&(memberOfGroupId=security-champions)(kreditorEnabledUser=TRUE))",
          ],
          attributes: ["displayName", "mail", "klarnaAccountabilityOU"],
          attributesToReviewer: async (ldapUser) => {
            const user: Reviewer = {
              sub: ldapUser["mail"].toString(),
              mail: ldapUser["mail"].toString(),
              name: ldapUser["displayName"].toString(),
              recommended: false,
            };
            return user;
          },
        },
        reviewerLookup: {
          searchBase: LDAPUserSearchBase,
          searchFilter: (sub) => {
            return `(&(mail=${sub})(kreditorEnabledUser=TRUE))`;
          },
          attributes: ["displayName", "mail", "klarnaAccountabilityOU"],
          attributesToReviewer: async (ldapUser) => {
            const user: Reviewer = {
              sub: ldapUser["mail"].toString(),
              mail: ldapUser["mail"].toString(),
              name: ldapUser["displayName"].toString(),
              recommended: false,
            };
            return user;
          },
        },
        ldapSettings,
      }
    );

    // cron jobs
    cron.schedule("0 6 * * *", async () => {
      // runs every day at 06:00 AM
      const cronJobs = new KlarnaCronJob(dal);
      await cronJobs.sendRemindersForMeetingRequested();
      await cronJobs.sendRemindersForRequested();
      await cronJobs.reassignOverdueReviews();
    });

    cron.schedule("*/30 * * * *", async () => {
      // runs every 30 minutes
      await reviewerProvider.preloadReviewers();
    });

    cron.schedule("*/10 * * * *", async () => {
      // runs every 30 minutes
      systemProvider.loadSystems();
    });

    cron.schedule("*/30 * * * *", async () => LDAPCache.expire());

    return {
      assetFolders: [AWSAssets, SVGPornAssets],
      componentClasses: [...AWSComponentClasses, ...SVGPornComponentClasses],
      identityProviders: [oidc, ldap],
      notificationTemplates: [...defaultNotifications],
      reviewerProvider,
      systemProvider,
      systemPropertyProviders: [ngovProvider],
      authzProvider: ldapAuthz,
      userProvider: ldapUserProvider,
      teamProvider: ldapTeamProvider,
      suggestionSources: [new ThreatLibSuggestionProvider()],
    };
  },
};

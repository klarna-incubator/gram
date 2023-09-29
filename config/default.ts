import cron from "node-cron";
import { AWSAssets, AWSComponentClasses } from "@gram/aws";
import { Reviewer } from "@gram/core/dist/auth/models/Reviewer.js";
import { User } from "@gram/core/dist/auth/models/User.js";
import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";
import type {
  GramConfiguration,
  Providers,
} from "@gram/core/dist/config/GramConfiguration.js";
import type { DataAccessLayer } from "@gram/core/dist/data/dal.js";
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
import { LDAPClientSettings } from "@gram/ldap/dist/LDAPClientSettings.js";
import defaultNotifications from "./notifications/index.js";
import {
  KlarnaReviewerProvider,
  OctaneSystemProvider,
  NGOVSystemContextProvider,
  HSFContextProvider,
  KlarnaCronJob,
  KlarnaAssets,
  KlarnaComponentClasses,
  hookIntoReviewApproval,
} from "@gram/klarna";
import { AzureComponentClasses, AzureAssets } from "@gram/azure";
import { CNCFComponentClasses, CNCFAssets } from "@gram/cncf";
import { KubernetesComponentClasses, KubernetesAssets } from "@gram/kubernetes";
import { Role } from "@gram/core/dist/auth/models/Role.js";

export const LDAPUserSearchBase = "ou=People,dc=internal,dc=machines";
export const LDAPTeamSearchBase = "ou=Klarna,dc=internal,dc=machines";

export const ldapSettings: LDAPClientSettings = {
  clientOptions: {
    url: "ldaps://ldap.klarna.net",
  },
  bindOptions: {
    bindDN: new EnvSecret("LDAP_BIND_DN"),
    bindCredentials: new EnvSecret("LDAP_BIND_CREDENTIALS"),
  },
};

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
    {
      name: "Feedback",
      path: "https://docs.google.com/forms/d/e/1FAIpQLSfVTLCR_VHTzIhDZ8MRFLpfm58LNlf0zICS2brYMOok7LrURA/viewform?usp=sf_link",
    },
    {
      name: "Docs",
      path: "https://kep.klarna.net/docs/secure-development/threat_modeling/threat_modeling/",
    },
    {
      name: "Support",
      path: "https://klarna.slack.com/archives/C04RMEJ8VFD",
    },
  ],

  bootstrapProviders: async function (
    dal: DataAccessLayer
  ): Promise<Providers> {
    const oidc = new OIDCIdentityProvider(
      (await new EnvSecret("OIDC_CLIENT_DISCOVER_URL").getValue()) as string,
      new EnvSecret("OIDC_CLIENT_ID"),
      new EnvSecret("OIDC_CLIENT_SECRET"),
      new EnvSecret("OIDC_SESSION_SECRET"),
      "email",
      "okta"
    );

    const ldap = new LDAPBasicAuthIdentityProvider(
      ldapSettings,
      (name: string) => `uid=${name},ou=People,dc=internal,dc=machines`
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
      searchFilter: (sub: string) => {
        return `(&(mail=${sub})(kreditorEnabledUser=TRUE))`;
      },
    });

    const ldapUserProvider = new LDAPUserProvider({
      ldapSettings,
      searchBase: LDAPUserSearchBase,
      searchFilter: (sub: string) => {
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

    // Hook for Reviews to create Risk Tickets
    await hookIntoReviewApproval(
      dal,
      systemProvider,
      new EnvSecret("JIRA_HOST"),
      new EnvSecret("JIRA_TOKEN"),
      new EnvSecret("JIRA_USER"),
      new EnvSecret("JIRA_PASSWORD")
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
      assetFolders: [
        KlarnaAssets,
        AWSAssets,
        SVGPornAssets,
        AzureAssets,
        CNCFAssets,
        KubernetesAssets,
      ],
      componentClasses: [
        ...KlarnaComponentClasses,
        ...AWSComponentClasses,
        ...SVGPornComponentClasses,
        ...AzureComponentClasses,
        ...CNCFComponentClasses,
        ...KubernetesComponentClasses,
      ],
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

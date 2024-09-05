import { AWSAssets, AWSComponentClasses } from "@gram/aws";
import { AzureAssets, AzureComponentClasses } from "@gram/azure";
import { CNCFAssets, CNCFComponentClasses } from "@gram/cncf";
import { Reviewer } from "@gram/core/dist/auth/models/Reviewer.js";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import { User } from "@gram/core/dist/auth/models/User.js";
import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";
import type {
  GramConfiguration,
  Providers,
} from "@gram/core/dist/config/GramConfiguration.js";
import type { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import {
  JupiterOneDomainSystemPropertyProvider,
  JupiterOneSystemPropertyProvider,
  JupiterOneTeamProvider,
  createJ1Client,
} from "@gram/jupiterone";
import {
  KlarnaAssets,
  KlarnaComponentClasses,
  KlarnaCronJob,
  KlarnaReviewerProvider,
  KlarnaSystemProvider
} from "@gram/klarna";
import { KubernetesAssets, KubernetesComponentClasses } from "@gram/kubernetes";
import {
  LDAPBasicAuthIdentityProvider,
  LDAPGroupBasedAuthzProvider,
  LDAPUserProvider,
} from "@gram/ldap";
import { LDAPClientSettings } from "@gram/ldap/dist/LDAPClientSettings.js";
import { OIDCIdentityProvider } from "@gram/oidc";
import { StrideSuggestionProvider } from "@gram/stride";
import { SVGPornAssets, SVGPornComponentClasses } from "@gram/svgporn";
import { ThreatsaurusSuggestionSource } from "@gram/threatsaurus";
import { SystemRegistrySystemProvider } from "@gram/klarna";
import defaultNotifications from "./notifications/index.js";

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
    ssl: process.env.POSTGRES_DISABLE_SSL === undefined ? true : false,
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
    connect: ["o24547.ingest.sentry.io"],
    frameAncestors: ["https://*.klarna.net", "http://localhost:*"],
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
      path: "https://wiki.klarna.net/wiki/Secure_Development/Threat_Modeling_-_Threat_Modeling_Process",
    },
    {
      name: "Support",
      path: "https://klarna.slack.com/archives/C04RMEJ8VFD",
    },
  ],

  contact: {
    name: "Secure Development Team",
    email: "secure-development@klarna.com",
    slackUrl: "https://klarna.enterprise.slack.com/archives/C01FZM386J1",
  },

  bootstrapProviders: async function (
    dal: DataAccessLayer
  ): Promise<Providers> {
    // process.env.GLOBAL_AGENT_HTTPS_PROXY = process.env.HTTPS_PROXY;
    // (global as any).GLOBAL_AGENT.HTTPS_PROXY = process.env.HTTPS_PROXY;
    //   global as any
    // ).GLOBAL_AGENT.HTTP_PROXY = process.env.HTTPS_PROXY;

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
      (name: string) => `uid=${name},ou=People,dc=internal,dc=machines`,
      (username: string) => `${username}@klarna.com`
    );

    const ldapAuthz = new LDAPGroupBasedAuthzProvider(dal, {
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
      attributes: ["displayName", "mail"],
      attributesToUser: async (ldapUser) => {
        const user: User = {
          sub: ldapUser["mail"].toString(),
          mail: ldapUser["mail"].toString(),
          name: ldapUser["displayName"].toString(),
        };
        return user;
      },
    });

    const j1ClientFactory = () =>
      createJ1Client(
        new EnvSecret("J1_KEY"),
        "45377d01-965c-4c5c-a3c1-e6ac4f80cc48",
        "https://api.eu.jupiterone.io" // https://jupiter-one-proxy-eu.production.c2c.klarna.net/
      );

    const j1TeamProvider = new JupiterOneTeamProvider(j1ClientFactory);
    const registrySystemProvider = new SystemRegistrySystemProvider(new EnvSecret("SYSTEM_REGISTRY_USER"), new EnvSecret("SYSTEM_REGISTRY_PASSWORD"));
    const j1SystemProvider = new KlarnaSystemProvider(
      registrySystemProvider,
      j1ClientFactory
    );
    const j1SysPropProvider = new JupiterOneSystemPropertyProvider(
      j1ClientFactory
    );
    const j1DomainProvider = new JupiterOneDomainSystemPropertyProvider(
      j1ClientFactory
    );

    const reviewerProvider = new KlarnaReviewerProvider(
      dal,
      j1SystemProvider,
      j1SysPropProvider,
      {
        groupLookup: {
          searchBase: LDAPUserSearchBase,
          groupFilters: [
            "(&(memberOfGroupId=access.secure-development)(kreditorEnabledUser=TRUE))",
            "(&(memberOfGroupId=domain.security.leads)(kreditorEnabledUser=TRUE))",
            process.env["NODE_ENV"] == "production"
              ? "(&(memberOfGroupId=access.1288598.prod.reviewers)(kreditorEnabledUser=TRUE))"
              : "(&(memberOfGroupId=access.1288598.stag.reviewers)(kreditorEnabledUser=TRUE))",
            "(&(memberOfGroupId=security-champions)(kreditorEnabledUser=TRUE))",
          ],
          attributes: ["displayName", "mail", "klarnaAccountabilityOU"],
          attributesToReviewer: async (ldapUser: any) => {
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
          searchFilter: (sub: string) => {
            return `(&(mail=${sub})(kreditorEnabledUser=TRUE))`;
          },
          attributes: ["displayName", "mail", "klarnaAccountabilityOU"],
          attributesToReviewer: async (ldapUser: any) => {
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

    const threatsaurus = new ThreatsaurusSuggestionSource(
      process.env["THREATSAURUS_URL"] as string
    );

    new KlarnaCronJob(dal, reviewerProvider);

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
      systemProvider: j1SystemProvider,
      systemPropertyProviders: [j1SysPropProvider, j1DomainProvider],
      authzProvider: ldapAuthz,
      userProvider: ldapUserProvider,
      teamProvider: j1TeamProvider,
      suggestionSources: [threatsaurus, new StrideSuggestionProvider()],
      searchProviders: [
        j1SystemProvider, // Without a system search provider, certain features will not work
        j1TeamProvider, // completely optional
        dal.modelService,
      ],
    };
  },
};

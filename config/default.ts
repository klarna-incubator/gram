import { AWSAssets, AWSComponentClasses } from "@gram/aws";
import { AzureAssets, AzureComponentClasses } from "@gram/azure";
import { CNCFAssets, CNCFComponentClasses } from "@gram/cncf";
import { Reviewer } from "@gram/core/dist/auth/models/Reviewer.js";
import { User } from "@gram/core/dist/auth/models/User.js";
import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";
import type {
  GramConfiguration,
  Providers,
} from "@gram/core/dist/config/GramConfiguration.js";
import type { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import System from "@gram/core/dist/data/systems/System.js";
import { KubernetesAssets, KubernetesComponentClasses } from "@gram/kubernetes";
import {
  MagicLinkEmail,
  MagicLinkIdentityProvider,
  MagicLinkMigrations,
} from "@gram/magiclink";
import { SVGPornAssets, SVGPornComponentClasses } from "@gram/svgporn";
import { ThreatLibSuggestionProvider } from "@gram/threatlib";
import defaultNotifications from "./notifications/index.js";
import { StaticAuthzProvider } from "./providers/static/StaticAuthzProvider.js";
import { StaticReviewerProvider } from "./providers/static/StaticReviewerProvider.js";
import { StaticSystemProvider } from "./providers/static/StaticSystemProvider.js";
import { StaticUserProvider } from "./providers/static/StaticUserProvider.js";
import { Team } from "@gram/core/dist/auth/models/Team.js";
import { StaticTeamProvider } from "./providers/static/StaticTeamProvider.js";
import { StrideSuggestionProvider } from "@gram/stride";
import { StaticValidationProvider } from "./providers/static/StaticValidationProvider.js";

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
    connect: [],
    frameAncestors: [],
  },

  menu: [
    {
      name: "Github",
      path: "https://github.com/klarna-incubator/gram",
    },
  ],

  contact: {
    name: "Security Team",
    email: undefined,
    slackUrl: undefined,
  },

  additionalMigrations: [MagicLinkMigrations],

  attributes: {
    flow: [
      {
        key: "protocols",
        type: "select",
        defaultValue: [],
        label: "Protocol(s)",
        options: [
          "HTTP",
          "HTTPS",
          "FTP",
          "SSH",
          "SMTP",
          "POP3",
          "IMAP",
          "DNS",
          "LDAP",
          "SMB",
          "gRPC",
          "MQTT",
          "AMQP",
        ],
        allowCustomValue: true,
        allowMultiple: true,
        optional: false,
      },
      {
        key: "authentication",
        type: "select",
        defaultValue: [],
        label: "Authentication",
        options: ["Basic Auth", "JWT", "OIDC", "None"],
        allowCustomValue: true,
        allowMultiple: true,
        optional: false,
      },
      {
        key: "data_type",
        type: "select",
        defaultValue: [],
        label: "Type of Data",
        options: ["Personal Information", "Transaction Data"],
        allowCustomValue: true,
        allowMultiple: true,
        optional: true,
      },
      {
        key: "description",
        type: "description",        
        defaultValue: "",
        optional: true,
        label: "Description",
      },
    ],
  },

  bootstrapProviders: async function (
    dal: DataAccessLayer
  ): Promise<Providers> {
    const pluginPool = await dal.pluginPool("magic-link");
    const magicLink = new MagicLinkIdentityProvider(dal, pluginPool);

    const sampleUsers: User[] = [
      {
        name: "User",
        sub: "user@localhost", // Must be the same as sub provided by IdentityProvider for authz to work
        mail: "user@localhost",
      },
      {
        name: "Reviewer",
        sub: "reviewer@localhost",
        mail: "reviewer@localhost",
      },
      {
        name: "Admin",
        sub: "admin@localhost",
        mail: "admin@localhost",
      },
    ];

    const sampleReviewers: Reviewer[] = [
      {
        name: "Reviewer",
        sub: "reviewer@localhost",
        mail: "reviewer@localhost",
        recommended: false,
      },
      {
        name: "Admin",
        sub: "admin@localhost",
        mail: "admin@localhost",
        recommended: false,
      },
    ];

    const fallbackReviewer: Reviewer = {
      name: "Security Team",
      recommended: true,
      sub: "security-team@localhost",
      mail: "security-team@localhost",
      slackUrl: "",
    };

    const sampleTeams: Team[] = [
      {
        id: "frontend",
        name: "Frontend Team",
        email: "frontend@localhost",
      },
      {
        id: "backend",
        name: "Backend Team",
        email: "backend@localhost",
      },
    ];

    const teamMap: Map<string, string[]> = new Map([
      ["user@localhost", ["frontend"]],
      ["reviewer@localhost", ["backend"]],
      ["admin@localhost", ["backend", "frontend"]],
    ]);

    const sampleSystems: System[] = [
      new System(
        "web",
        "Website",
        "Website",
        [sampleTeams[0]],
        "The main website of the org"
      ),
      new System(
        "order-api",
        "Order API",
        "Order API",
        [sampleTeams[1]],
        "Backend API for receiving orders"
      ),
    ];

    const systemProvider = new StaticSystemProvider(sampleSystems);
    const teamProvider = new StaticTeamProvider(sampleTeams, teamMap);
    const staticValidationProvider = new StaticValidationProvider();

    return {
      assetFolders: [
        AWSAssets,
        AzureAssets,
        CNCFAssets,
        KubernetesAssets,
        SVGPornAssets,
      ],
      componentClasses: [
        ...AWSComponentClasses,
        ...AzureComponentClasses,
        ...CNCFComponentClasses,
        ...KubernetesComponentClasses,
        ...SVGPornComponentClasses,
      ],
      identityProviders: [magicLink],
      notificationTemplates: [MagicLinkEmail(), ...defaultNotifications],
      reviewerProvider: new StaticReviewerProvider(
        sampleReviewers,
        fallbackReviewer
      ),
      authzProvider: new StaticAuthzProvider(
        dal,
        [sampleUsers[0].sub],
        [sampleUsers[1].sub],
        [sampleUsers[2].sub]
      ),
      userProvider: new StaticUserProvider(sampleUsers),
      systemProvider: systemProvider,
      suggestionSources: [
        new ThreatLibSuggestionProvider(),
        new StrideSuggestionProvider(),
      ],
      teamProvider: teamProvider,
      searchProviders: [
        systemProvider, // Without a system search provider, certain features will not work
        teamProvider, // completely optional
        dal.modelService,
      ],
      validationProviders: [staticValidationProvider],
    };
  },
};

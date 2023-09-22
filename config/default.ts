import { AWSAssets, AWSComponentClasses } from "@gram/aws";
import { Reviewer } from "@gram/core/dist/auth/models/Reviewer";
import { User } from "@gram/core/dist/auth/models/User";
import { EnvSecret } from "@gram/core/dist/config/EnvSecret";
import type {
  GramConfiguration,
  Providers,
} from "@gram/core/dist/config/GramConfiguration";
import type { DataAccessLayer } from "@gram/core/dist/data/dal";
import System from "@gram/core/dist/data/systems/System";
import {
  MagicLinkEmail,
  MagicLinkIdentityProvider,
  MagicLinkMigrations,
} from "@gram/magiclink";
import { SVGPornAssets, SVGPornComponentClasses } from "@gram/svgporn";
import { ThreatLibSuggestionProvider } from "@gram/threatlib";
import defaultNotifications from "./notifications";
import { StaticAuthzProvider } from "./providers/static/StaticAuthzProvider";
import { StaticReviewerProvider } from "./providers/static/StaticReviewerProvider";
import { StaticSystemProvider } from "./providers/static/StaticSystemProvider";
import { StaticUserProvider } from "./providers/static/StaticUserProvider";

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

  additionalMigrations: [MagicLinkMigrations],

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
        name: "Security Team",
        recommended: true,
        sub: "security-team@localhost",
        mail: "security-team@localhost",
        slackUrl: "",
      },
    ];

    const sampleSystems: System[] = [
      new System(
        "web",
        "Website",
        "Website",
        [],
        "The main website of the org"
      ),
      new System(
        "order-api",
        "Order API",
        "Order API",
        [],
        "Backend API for receiving orders"
      ),
    ];

    return {
      assetFolders: [AWSAssets, SVGPornAssets],
      componentClasses: [...AWSComponentClasses, ...SVGPornComponentClasses],
      identityProviders: [magicLink],
      notificationTemplates: [MagicLinkEmail(), ...defaultNotifications],
      reviewerProvider: new StaticReviewerProvider(
        sampleReviewers,
        sampleReviewers[1]
      ),
      authzProvider: new StaticAuthzProvider(
        [sampleUsers[0].sub],
        [sampleUsers[1].sub],
        [sampleUsers[2].sub]
      ),
      userProvider: new StaticUserProvider(sampleUsers),
      systemProvider: new StaticSystemProvider(sampleSystems),
      suggestionSources: [new ThreatLibSuggestionProvider()],
    };
  },
};

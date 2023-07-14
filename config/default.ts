import type {
  GramConfiguration,
  Providers,
} from "@gram/core/dist/config/GramConfiguration";
import type { DataAccessLayer } from "@gram/core/dist/data/dal";
import { EnvSecret } from "./util/EnvSecret";
import { AWSAssets, AWSComponentClasses } from "@gram/aws";
import { SVGPornAssets, SVGPornComponentClasses } from "@gram/svgporn";
import { ThreatLibSuggestionProvider } from "@gram/threatlib";
import {
  MagicLinkEmail,
  MagicLinkIdentityProvider,
  MagicLinkMigrations,
} from "@gram/magiclink";
import { EmailReviewApproved } from "./notifications/EmailReviewApproved";
import { EmailReviewCanceled } from "./notifications/EmailReviewCanceled";
import { EmailReviewDeclined } from "./notifications/EmailReviewDeclined";
import { EmailReviewerChanged } from "./notifications/EmailReviewerChanged";
import { EmailReviewMeetingRequested } from "./notifications/EmailReviewMeetingRequested";
import { EmailReviewMeetingRequestedReminder } from "./notifications/EmailReviewMeetingRequestedReminder";
import { EmailReviewRequested } from "./notifications/EmailReviewRequested";
import { EmailReviewRequestedReminder } from "./notifications/EmailReviewRequestedReminder";
import { StaticReviewerProvider } from "./providers/static/StaticReviewerProvider";
import { StaticAuthzProvider } from "./providers/static/StaticAuthzProvider";
import { StaticUserProvider } from "./providers/static/StaticUserProvider";
import { DummySystemProvider } from "./providers/dummy/DummySystemProvider";

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
        header: ["authorization", "x-google-id-token", "cookie"],
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

    return {
      assetFolders: [AWSAssets, SVGPornAssets],
      componentClasses: [...AWSComponentClasses, ...SVGPornComponentClasses],
      identityProviders: [magicLink],
      notificationTemplates: [
        MagicLinkEmail(),
        EmailReviewApproved(),
        EmailReviewCanceled(),
        EmailReviewDeclined(),
        EmailReviewerChanged(),
        EmailReviewMeetingRequested(),
        EmailReviewMeetingRequestedReminder(),
        EmailReviewRequested(),
        EmailReviewRequestedReminder(),
      ],
      reviewerProvider: new StaticReviewerProvider(),
      authzProvider: new StaticAuthzProvider(),
      userProvider: new StaticUserProvider(),
      systemProvider: new DummySystemProvider(),
      suggestionSources: [new ThreatLibSuggestionProvider()],
    };
  },
};

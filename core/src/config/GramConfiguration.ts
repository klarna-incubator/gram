import type { AuthzProvider } from "../auth/AuthzProvider";
import type { IdentityProvider } from "../auth/IdentityProvider";
import type { UserProvider } from "../auth/UserProvider";
import type { ComponentClass } from "../data/component-classes";
import type { DataAccessLayer } from "../data/dal";
import type { ReviewerProvider } from "../data/reviews/ReviewerProvider";
import type { SystemPropertyProvider } from "../data/system-property/SystemPropertyProvider";
import type { SystemProvider } from "../data/systems/SystemProvider";
import type { NotificationTemplate } from "../notifications/NotificationTemplate";
import type { SuggestionSource } from "../suggestions/models";
import type { AssetFolder } from "./AssetFolder";
import type { Secret } from "./Secret";
import type { Migration } from "../data/Migration";
import type { TeamProvider } from "../auth/TeamProvider";

export interface Providers {
  /**
   * Required for minimal setup.
   */
  identityProviders: [IdentityProvider, ...IdentityProvider[]];
  authzProvider: AuthzProvider;
  systemProvider: SystemProvider;
  userProvider: UserProvider;
  reviewerProvider: ReviewerProvider;

  /**
   * Not required for minimal setup.
   */
  systemPropertyProviders?: SystemPropertyProvider[];
  assetFolders?: AssetFolder[];
  componentClasses?: ComponentClass[];
  notificationTemplates?: NotificationTemplate[];
  suggestionSources?: SuggestionSource[];
  teamProvider?: TeamProvider;
}

export interface GramConfiguration {
  appPort: number;
  controlPort: number;
  origin: string;

  /**
   * Database settings
   */
  postgres: {
    host: Secret;
    user: Secret;
    password: Secret;
    database: Secret;
    port: Secret;
    ssl: boolean;
  };

  /**
   * Auth token
   */
  jwt: {
    ttl: number;
    secret: {
      auth: Secret;
    };
  };

  log: {
    layout: string;
    level: string;
    auditHttp: {
      excludeKeys: {
        header: string[];
        body: string[];
      };
      includeKeys: {
        header: string[];
      };
      simplified: boolean;
    };
  };

  notifications: {
    providers: {
      email: {
        user: Secret;
        password: Secret;
        host: Secret;
        port: Secret;
        senderName?: string;
        // Allow overriding recipient email for debug purposes. This will make all outgoing email go to this address instead.
        overrideRecipient?: string;
      };
    };
  };

  /**
   * Used for CSP policy.
   */
  allowedSrc: {
    img: string[];
    connect: string[];
  };

  /**
   * Extra menu items, e.g. links to be rendered in the frontend navbar.
   */
  menu: {
    name: string;
    path: string;
  }[];

  /**
   * Optional sentryDSN to connect to sentry.
   */
  sentryDSN?: string;

  /**
   * Additional Migrations - e.g. for plugins
   */
  additionalMigrations?: Migration[];

  /**
   * In case outgoing HTTP/HTTPS connections have to go through a proxy.
   */
  httpsProxy?: string;

  bootstrapProviders(dal: DataAccessLayer): Promise<Providers>;
}

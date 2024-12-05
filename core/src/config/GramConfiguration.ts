import type { AuthzProvider } from "../auth/AuthzProvider.js";
import type { IdentityProvider } from "../auth/IdentityProvider.js";
import type { UserProvider } from "../auth/UserProvider.js";
import type { ComponentClass } from "../data/component-classes/index.js";
import type { DataAccessLayer } from "../data/dal.js";
import type { ReviewerProvider } from "../data/reviews/ReviewerProvider.js";
import type { SystemPropertyProvider } from "../data/system-property/SystemPropertyProvider.js";
import type { SystemProvider } from "../data/systems/SystemProvider.js";
import type { ResourceProvider } from "../resources/ResourceHandler.js";
import type { NotificationTemplate } from "../notifications/NotificationTemplate.js";
import type { SuggestionSource } from "../suggestions/models.js";
import type { AssetFolder } from "./AssetFolder.js";
import type { Secret } from "./Secret.js";
import type { Migration } from "../data/Migration.js";
import type { TeamProvider } from "../auth/TeamProvider.js";
import type { ActionItemExporter } from "../action-items/ActionItemExporter.js";
import type { SearchProvider } from "../search/SearchHandler.js";
import { ValidationRule } from "../validation/models.js";
import type { DynamicAttribute } from "../attributes/attributes.js";
import { ConnectionOptions } from "tls";

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
  actionItemExporters?: ActionItemExporter[];
  searchProviders?: SearchProvider[];
  validationSources?: ValidationRule[][];
  resourceProviders?: ResourceProvider[];
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
    ssl: boolean | ConnectionOptions;
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
   * Optional contact details to the team or person managing this Gram installation.
   * See it as the support email for your security team in your org.
   */
  contact?: {
    name: string;
    email?: string;
    slackUrl?: string;
  };

  /**
   * Used for CSP policy.
   */
  allowedSrc: {
    img: string[];
    connect: string[];
    frameAncestors: string[];
  };

  /**
   * Extra menu items, e.g. links to be rendered in the frontend navbar.
   */
  menu: {
    name: string;
    path: string;
  }[];

  /**
   * Attribute customization.
   */
  attributes: {
    flow: DynamicAttribute[];
  };

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

import type { AuthzProvider } from "../auth/AuthzProvider.js";
import type { IdentityProvider } from "../auth/IdentityProvider.js";
import type { UserProvider } from "../auth/UserProvider.js";
import type { ComponentClass } from "../data/component-classes/index.js";
import type { DataAccessLayer } from "../data/dal.js";
import type { ReviewerProvider } from "../data/reviews/ReviewerProvider.js";
import type { SystemPropertyProvider } from "../data/system-property/SystemPropertyProvider.js";
import type { SystemProvider } from "../data/systems/SystemProvider.js";
import type { ResourceProvider } from "../resources/ResourceHandler.js";
import type { NotificationProvider } from "../notifications/NotificationProvider.js";
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
  notificationProviders?: NotificationProvider[];
  suggestionSources?: SuggestionSource[];
  teamProvider?: TeamProvider;
  actionItemExporters?: ActionItemExporter[];
  searchProviders?: SearchProvider[];
  validationSources?: ValidationRule[][];
  resourceProviders?: ResourceProvider[];
}

export interface NotificationConfiguration {
  /**
   * Cadence (in days) for the review-lifecycle reminder/reassignment cron jobs.
   * Optional - deployments that don't set these keep the built-in defaults.
   */
  reviewReminders?: {
    // How many days after a review is requested before the first reminder is sent.
    requestedAfterDays: number;
    // How often (in days) a meeting-requested reminder repeats until a meeting is scheduled.
    meetingRequestedRemindForEveryXDays: number;
    // How many days of inactivity before an overdue review is automatically reassigned.
    reassignAfterDays: number;
  };
  /**
   * Link to your org's threat-model review playbook, referenced in
   * review-requested notification emails.
   */
  playbookUrl?: string;
  /**
   * Optional link to book/schedule a threat-model review session (e.g. a
   * calendar booking page), referenced in review-meeting-requested
   * notification emails.
   */
  sessionBookingUrl?: string;
  /**
   * Cadence (in ms) for the notification background jobs started in
   * api/src/index.ts. Optional - deployments that don't set these keep the
   * built-in defaults.
   */
  intervals?: {
    // How often to poll and send newly queued notifications.
    notificationInterval?: number;
    // How often to retry previously-failed notifications.
    notificationRetryInterval?: number;
    // How often to run the notification retention cleanup sweep.
    notificationRetentionInterval?: number;
    // How old (in ms) a notification row must be before the retention sweep deletes it.
    notificationRetentionWindow?: number;
  };
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

  notifications: NotificationConfiguration;

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

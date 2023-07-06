import { readdirSync, symlinkSync, unlinkSync } from "fs";
import { isAbsolute, join } from "path";
import { ComponentClass } from "./data/component-classes";
import { DataAccessLayer } from "./data/dal";
import { getLogger } from "./logger";
import { NotificationTemplate } from "./notifications/NotificationTemplate";
import { SuggestionSource } from "./suggestions/models";
import { AuthzProvider } from "./auth/AuthzProvider";
import { AuthProvider } from "./auth/AuthProvider";
import AuthProviderRegistry from "./auth/AuthProviderRegistry";
import { setAuthorizationProvider as setAuthzProvider } from "./auth/authorization";
import { setSystemProvider } from "./data/systems/systems";
import { SystemProvider } from "./data/systems/SystemProvider";
import { UserProvider } from "./auth/UserProvider";
import { setUserProvider } from "./auth/user";
import {
  ReviewerProvider,
  setReviewerProvider,
} from "./data/reviews/ReviewerProvider";
import { SystemPropertyProvider } from "./data/system-property/SystemPropertyProvider";
import { Application } from "express";
import { getPool, migratePlugin } from "./plugins/data";
import { Pool } from "pg";

export interface PluginRegistrator {
  // Expose DataAccessLayer to packs in case they need to query the database.
  dal: DataAccessLayer;
  // Exposed Express app for plugins to be able to attach new routes etc.
  app: Application;

  registerAssets(name: string, path: string): void;
  /**
   * TODO: clean up by Abstracting "Something"Provider, same pattern everywhere here:
   */
  registerSystemPropertyProvider(
    systemPropertyProvider: SystemPropertyProvider
  ): void;
  registerComponentClasses(classes: ComponentClass[]): void;
  registerNotificationTemplates(templates: NotificationTemplate[]): void;
  registerSuggestionSource(source: SuggestionSource): void;
  registerAuthProvider(authProvider: AuthProvider): void;
  setAuthzProvider(authzProvider: AuthzProvider): void;
  setSystemProvider(systemProvider: SystemProvider): void;
  setUserProvider(userProvider: UserProvider): void;
  setReviewerProvider(reviewerProvider: ReviewerProvider): void;

  // Data related stuff for plugins that need to create their own database tables
  getPluginDbPool(pluginDbSuffix: string): Promise<Pool>;
  migrate(pluginDbSuffix: string, migrationsFolder: string): Promise<void>;
}

export interface Plugin {
  bootstrap(reg: PluginRegistrator): Promise<void>;
}

/* Could create a temporary directory instead */
export const AssetDir = "assets";

const StaticAssets = [
  "placeholder.svg",
  "almost-secure.svg",
  "secure.svg",
  "vulnerable.svg",
  "unknown.svg",
];

export class PluginCompiler implements PluginRegistrator {
  assetPaths: { name: string; path: string }[];
  log: any;

  constructor(public dal: DataAccessLayer, public app: Application) {
    this.assetPaths = [];
    this.log = getLogger("PackCompiler");
  }

  async getPluginDbPool(pluginDbSuffix: string): Promise<Pool> {
    return getPool(pluginDbSuffix);
  }

  async migrate(
    pluginDbSuffix: string,
    migrationsFolder: string
  ): Promise<void> {
    return migratePlugin(pluginDbSuffix, migrationsFolder);
  }

  /**
   * registerAssets allows packs to provide static content (e.g. images) that
   * will be hosted by the gram app under the asset route. Paths registered this
   * way will be hosted as: http(s)://<domain>/assets/<name>/
   * @param name alias or identifier for your pack
   * @param path absolute path of directory to symlink to
   */
  registerAssets(name: string, path: string): void {
    if (!isAbsolute(path)) throw new Error("Pack asset path must be absolute.");
    if (this.assetPaths.find((a) => a.name === name)) {
      throw new Error("alias already registered");
    }
    // Hack: the path sent is from the compiled typescript, which does not copy
    // over the images into the same directory. This is not a good solution,
    // but should work until we move packs over to npm packages.
    path = path.replace("dist/", "src/");
    // TODO: should validate that name is only valid chars
    this.assetPaths.push({ name, path });
    this.log.info(`Registered Assets ${name} @ ${path}`);
  }

  registerSystemPropertyProvider(
    systemPropertyProvider: SystemPropertyProvider
  ): void {
    this.dal.sysPropHandler.registerSystemPropertyProvider(
      systemPropertyProvider
    );
    this.log.info(
      `Registered SystemPropertyProvider ${systemPropertyProvider.id}`
    );
  }

  registerComponentClasses(classes: ComponentClass[]): void {
    classes.forEach((cl) => this.dal.ccHandler.add(cl));
    this.log.info(`Registered component classes`);
  }

  registerNotificationTemplates(templates: NotificationTemplate[]): void {
    templates.forEach((t) => {
      this.dal.templateHandler.register(t);
      this.log.info(`Registered notification template: ${t.key}`);
    });
  }

  registerSuggestionSource(source: SuggestionSource): void {
    this.log.info(`Registered Suggestion Source: ${source.name}`);
    this.dal.suggestionEngine.register(source);
  }

  registerAuthProvider(authProvider: AuthProvider) {
    this.log.info(`Registered Auth Provider: ${authProvider.key}`);
    AuthProviderRegistry.set(authProvider.key, authProvider);
  }

  setAuthzProvider(authzProvider: AuthzProvider) {
    this.log.info(`Set Authz Provider: ${authzProvider.key}`);
    setAuthzProvider(authzProvider);
  }

  setSystemProvider(systemProvider: SystemProvider) {
    this.log.info(`Set System Provider: ${systemProvider.key}`);
    setSystemProvider(systemProvider);
  }

  setUserProvider(userProvider: UserProvider) {
    this.log.info(`Set User Provider: ${userProvider.key}`);
    setUserProvider(userProvider);
  }

  setReviewerProvider(reviewerProvider: ReviewerProvider): void {
    this.log.info(`Set Reviewer Provider: ${reviewerProvider.key}`);
    setReviewerProvider(reviewerProvider);
  }

  compileAssets() {
    const files = readdirSync(AssetDir);
    this.log.info("Clearing asset symlinks");
    files
      .filter((f) => !f.startsWith(".") && !StaticAssets.includes(f))
      .forEach((f) => unlinkSync(join(AssetDir, f)));
    this.log.info("Registering new asset symlinks");
    this.assetPaths.forEach(({ name, path }) =>
      symlinkSync(path, join(AssetDir, name), "dir")
    );
  }
}

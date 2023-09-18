import { readdirSync, symlinkSync, unlinkSync } from "fs";
import { isAbsolute, join } from "path";
import { ComponentClass } from "./data/component-classes";
import { DataAccessLayer } from "./data/dal";
import { getLogger } from "log4js";
import { NotificationTemplate } from "./notifications/NotificationTemplate";
import { SuggestionSource } from "./suggestions/models";
import { AuthzProvider } from "./auth/AuthzProvider";
import { IdentityProvider } from "./auth/IdentityProvider";
import IdentityProviderRegistry from "./auth/IdentityProviderRegistry";
import { setAuthorizationProvider } from "./auth/authorization";
import { setSystemProvider } from "./data/systems/systems";
import { SystemProvider } from "./data/systems/SystemProvider";
import { UserProvider } from "./auth/UserProvider";
import { ReviewerProvider } from "./data/reviews/ReviewerProvider";
import { SystemPropertyProvider } from "./data/system-property/SystemPropertyProvider";
import { getPool, migratePlugin } from "./plugins/data";
import { Pool } from "pg";

/* Could create a temporary directory instead */
export const AssetDir = "assets";

export const StaticAssets = [
  "placeholder.svg",
  "almost-secure.svg",
  "secure.svg",
  "vulnerable.svg",
  "unknown.svg",
];

export class Bootstrapper {
  assetPaths: { name: string; path: string }[];
  log: any;

  constructor(public dal: DataAccessLayer) {
    this.assetPaths = [];
    this.log = getLogger("PackCompiler");
  }

  /**
   * Returns pool for unique database created for plugin. This will be connected to a separate schema name based on the pluginDbSuffix.
   * @param pluginDbSuffix
   */
  async getPluginDbPool(pluginDbSuffix: string): Promise<Pool> {
    return getPool(pluginDbSuffix);
  }

  /**
   * Perform database migrations on the plugin schema using migration scripts found in the migrationsFolder.
   * @param pluginDbSuffix
   * @param migrationsFolder
   */
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
  registerAssets(name: string, folderPath: string): void {
    if (!isAbsolute(folderPath))
      throw new Error("Pack asset path must be absolute.");
    if (this.assetPaths.find((a) => a.name === name)) {
      throw new Error("alias already registered");
    }
    // Hack: the path sent is from the compiled typescript, which does not copy
    // over the images into the same directory. This is not a good solution,
    // but should work until we move packs over to npm packages.
    folderPath = folderPath.replace("dist/", "src/");
    this.assetPaths.push({ name, path: folderPath });
    this.log.info(`Registered Assets ${name} @ ${folderPath}`);
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
    this.log.info(`Registered ${classes.length} component classes`);
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

  registerIdentityProvider(authProvider: IdentityProvider) {
    this.log.info(`Registered Auth Provider: ${authProvider.key}`);
    IdentityProviderRegistry.set(authProvider.key, authProvider);
  }

  setAuthorizationProvider(authzProvider: AuthzProvider) {
    this.log.info(`Set Authz Provider: ${authzProvider.key}`);
    setAuthorizationProvider(authzProvider);
  }

  setSystemProvider(systemProvider: SystemProvider) {
    this.log.info(`Set System Provider: ${systemProvider.key}`);
    setSystemProvider(systemProvider);
  }

  setUserProvider(userProvider: UserProvider) {
    this.log.info(`Set User Provider: ${userProvider.key}`);
    this.dal.userHandler.setUserProvider(userProvider);
  }

  setReviewerProvider(reviewerProvider: ReviewerProvider): void {
    this.log.info(`Set Reviewer Provider: ${reviewerProvider.key}`);
    this.dal.reviewerHandler.setReviewerProvider(reviewerProvider);
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

import { readdirSync, symlinkSync, unlinkSync } from "fs";
import { isAbsolute, join } from "path";
import { ComponentClass } from "./data/component-classes/index.js";
import { DataAccessLayer } from "./data/dal.js";
import log4js from "log4js";
import { NotificationTemplate } from "./notifications/NotificationTemplate.js";
import { SuggestionSource } from "./suggestions/models.js";
import { AuthzProvider } from "./auth/AuthzProvider.js";
import { IdentityProvider } from "./auth/IdentityProvider.js";
import IdentityProviderRegistry from "./auth/IdentityProviderRegistry.js";
import { setAuthorizationProvider } from "./auth/authorization.js";
import { setSystemProvider } from "./data/systems/systems.js";
import { SystemProvider } from "./data/systems/SystemProvider.js";
import { UserProvider } from "./auth/UserProvider.js";
import { ReviewerProvider } from "./data/reviews/ReviewerProvider.js";
import { SystemPropertyProvider } from "./data/system-property/SystemPropertyProvider.js";
import { getPool, migratePlugin } from "./plugins/data.js";
import pg from "pg";
import { TeamProvider } from "./auth/TeamProvider.js";
import { SearchProvider } from "./search/SearchHandler.js";
import { ValidationRule } from "./validation/models.js";

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
    this.log = log4js.getLogger("PackCompiler");
  }

  /**
   * Returns pool for unique database created for plugin. This will be connected to a separate schema name based on the pluginDbSuffix.
   * @param pluginDbSuffix
   */
  async getPluginDbPool(pluginDbSuffix: string): Promise<pg.Pool> {
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

  registerValidationSource(validationSource: ValidationRule[]): void {
    this.log.info(`Set Validation Provider: ${validationSource}`);
    this.dal.validationEngine.register(validationSource);
  }

  registerIdentityProvider(authProvider: IdentityProvider) {
    this.log.info(`Registered Auth Provider: ${authProvider.key}`);
    IdentityProviderRegistry.set(authProvider.key, authProvider);
  }

  registerSearchProvider(searchProvider: SearchProvider) {
    this.log.info(
      `Registered Search Provider: ${searchProvider.searchType.key}`
    );
    this.dal.searchHandler.register(searchProvider);
  }

  registerResourceProvider(resourceProvider: any) {
    this.log.info(`Registered Resource Provider: ${resourceProvider.key}`);
    this.dal.resourceHandler.register(resourceProvider);
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

  setTeamProvider(teamProvider: TeamProvider) {
    this.log.info(`Set Team Provider: ${teamProvider.key}`);
    this.dal.teamHandler.setTeamProvider(teamProvider);
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

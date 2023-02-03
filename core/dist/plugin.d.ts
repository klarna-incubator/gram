import { ComponentClass } from "./data/component-classes";
import { DataAccessLayer } from "./data/dal";
import { NotificationTemplate } from "./notifications/NotificationTemplate";
import { SuggestionSource } from "./suggestions/models";
import { AuthzProvider } from "./auth/AuthzProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { SystemProvider } from "./data/systems/SystemProvider";
import { UserProvider } from "./auth/UserProvider";
import { ReviewerProvider } from "./data/reviews/ReviewerProvider";
import { SystemPropertyProvider } from "./data/system-property/SystemPropertyProvider";
import { Application } from "express";
export interface PluginRegistrator {
    dal: DataAccessLayer;
    app: Application;
    registerAssets(name: string, path: string): void;
    /**
     * TODO: clean up by Abstracting "Something"Provider, same pattern everywhere here:
     */
    registerSystemPropertyProvider(systemPropertyProvider: SystemPropertyProvider): void;
    registerComponentClasses(classes: ComponentClass[]): void;
    registerNotificationTemplates(templates: NotificationTemplate[]): void;
    registerSuggestionSource(source: SuggestionSource): void;
    registerAuthProvider(authProvider: AuthProvider): void;
    setAuthzProvider(authzProvider: AuthzProvider): void;
    setSystemProvider(systemProvider: SystemProvider): void;
    setUserProvider(userProvider: UserProvider): void;
    setReviewerProvider(reviewerProvider: ReviewerProvider): void;
}
export interface Plugin {
    bootstrap(reg: PluginRegistrator): Promise<void>;
}
export declare const AssetDir = "assets";
export declare class PluginCompiler implements PluginRegistrator {
    dal: DataAccessLayer;
    app: Application;
    assetPaths: {
        name: string;
        path: string;
    }[];
    log: any;
    constructor(dal: DataAccessLayer, app: Application);
    /**
     * registerAssets allows packs to provide static content (e.g. images) that
     * will be hosted by the gram app under the asset route. Paths registered this
     * way will be hosted as: http(s)://<domain>/assets/<name>/
     * @param name alias or identifier for your pack
     * @param path absolute path of directory to symlink to
     */
    registerAssets(name: string, path: string): void;
    registerSystemPropertyProvider(systemPropertyProvider: SystemPropertyProvider): void;
    registerComponentClasses(classes: ComponentClass[]): void;
    registerNotificationTemplates(templates: NotificationTemplate[]): void;
    registerSuggestionSource(source: SuggestionSource): void;
    registerAuthProvider(authProvider: AuthProvider): void;
    setAuthzProvider(authzProvider: AuthzProvider): void;
    setSystemProvider(systemProvider: SystemProvider): void;
    setUserProvider(userProvider: UserProvider): void;
    setReviewerProvider(reviewerProvider: ReviewerProvider): void;
    compileAssets(): void;
}
//# sourceMappingURL=plugin.d.ts.map
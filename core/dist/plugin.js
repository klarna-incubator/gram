"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginCompiler = exports.AssetDir = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const logger_1 = require("./logger");
const AuthProviderRegistry_1 = __importDefault(require("./auth/AuthProviderRegistry"));
const authorization_1 = require("./auth/authorization");
const systems_1 = require("./data/systems/systems");
const user_1 = require("./auth/user");
const ReviewerProvider_1 = require("./data/reviews/ReviewerProvider");
/* Could create a temporary directory instead */
exports.AssetDir = "assets";
const StaticAssets = [
    "placeholder.svg",
    "almost-secure.svg",
    "secure.svg",
    "vulnerable.svg",
    "unknown.svg",
];
class PluginCompiler {
    constructor(dal, app) {
        this.dal = dal;
        this.app = app;
        this.assetPaths = [];
        this.log = (0, logger_1.getLogger)("PackCompiler");
    }
    /**
     * registerAssets allows packs to provide static content (e.g. images) that
     * will be hosted by the gram app under the asset route. Paths registered this
     * way will be hosted as: http(s)://<domain>/assets/<name>/
     * @param name alias or identifier for your pack
     * @param path absolute path of directory to symlink to
     */
    registerAssets(name, path) {
        if (!(0, path_1.isAbsolute)(path))
            throw new Error("Pack asset path must be absolute.");
        if (this.assetPaths.find((a) => a.name === name)) {
            throw new Error("alias already registered");
        }
        // Hack: the path sent is from the compiled typescript, which does not copy
        // over the images into the same directory. This is not a good solution,
        // but should work until we move packs over to npm packages.
        path = path.replace("build/", "");
        // TODO: should validate that name is only valid chars
        this.assetPaths.push({ name, path });
    }
    registerSystemPropertyProvider(systemPropertyProvider) {
        this.dal.sysPropHandler.registerSystemPropertyProvider(systemPropertyProvider);
        this.log.info(`Registered SystemPropertyProvider ${systemPropertyProvider.id}`);
    }
    registerComponentClasses(classes) {
        classes.forEach((cl) => this.dal.ccHandler.add(cl));
        this.log.info(`Registered component classes`);
    }
    registerNotificationTemplates(templates) {
        templates.forEach((t) => {
            this.dal.templateHandler.register(t);
            this.log.info(`Registered notification template: ${t.key}`);
        });
    }
    registerSuggestionSource(source) {
        this.log.info(`Registered Suggestion Source: ${source.name}`);
        this.dal.suggestionEngine.register(source);
    }
    registerAuthProvider(authProvider) {
        this.log.info(`Registered Auth Provider: ${authProvider.key}`);
        AuthProviderRegistry_1.default.set(authProvider.key, authProvider);
    }
    setAuthzProvider(authzProvider) {
        this.log.info(`Set Authz Provider: ${authzProvider.key}`);
        (0, authorization_1.setAuthorizationProvider)(authzProvider);
    }
    setSystemProvider(systemProvider) {
        this.log.info(`Set System Provider: ${systemProvider.key}`);
        (0, systems_1.setSystemProvider)(systemProvider);
    }
    setUserProvider(userProvider) {
        this.log.info(`Set User Provider: ${userProvider.key}`);
        (0, user_1.setUserProvider)(userProvider);
    }
    setReviewerProvider(reviewerProvider) {
        this.log.info(`Set Reviewer Provider: ${reviewerProvider.key}`);
        (0, ReviewerProvider_1.setReviewerProvider)(reviewerProvider);
    }
    compileAssets() {
        const files = (0, fs_1.readdirSync)(exports.AssetDir);
        this.log.info("Clearing asset symlinks");
        files
            .filter((f) => !f.startsWith(".") && !StaticAssets.includes(f))
            .forEach((f) => (0, fs_1.unlinkSync)((0, path_1.join)(exports.AssetDir, f)));
        this.log.info("Registering new asset symlinks");
        this.assetPaths.forEach(({ name, path }) => (0, fs_1.symlinkSync)(path, (0, path_1.join)(exports.AssetDir, name), "dir"));
    }
}
exports.PluginCompiler = PluginCompiler;
//# sourceMappingURL=plugin.js.map
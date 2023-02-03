"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermissionsForSystemId = exports.hasAnyPermissionsForModel = exports.hasPermissionsForModel = exports.hasAnyPermissionsForModelId = exports.hasPermissionsForModelId = exports.getPermissionsForModel = exports.getPermissionsForSystem = exports.setAuthorizationProvider = exports.authzProvider = exports.AllPermissions = exports.Permission = exports.AllRoles = void 0;
const errors_1 = require("../util/errors");
const AuthzError_1 = require("./AuthzError");
const Role_1 = require("./models/Role");
exports.AllRoles = [Role_1.Role.User, Role_1.Role.Reviewer, Role_1.Role.Admin];
var Permission;
(function (Permission) {
    Permission["Read"] = "read";
    Permission["Write"] = "write";
    Permission["Delete"] = "delete";
    Permission["Review"] = "review";
})(Permission = exports.Permission || (exports.Permission = {}));
exports.AllPermissions = [
    Permission.Read,
    Permission.Write,
    Permission.Delete,
    Permission.Review,
];
/**
 * Default authorization provider, for now just throws errors.
 * Implementing orgs should add their own rules here.
 */
class DefaultAuthzProvider {
    constructor() {
        this.key = "default";
        this.err = "Method not implemented.";
    }
    getPermissionsForSystem(ctx, systemId, user) {
        throw new Error(this.err);
    }
    getPermissionsForStandaloneModel(ctx, model, user) {
        throw new Error(this.err);
    }
}
exports.authzProvider = new DefaultAuthzProvider();
function setAuthorizationProvider(newAuthzProvider) {
    exports.authzProvider = newAuthzProvider;
}
exports.setAuthorizationProvider = setAuthorizationProvider;
/**
 * Get a user's permissions for a system. Performs a lookup against Jira, so use sparingly.
 *
 * @param systemId
 * @param userTeams
 * @returns
 */
function getPermissionsForSystem(ctx, systemId, user) {
    return __awaiter(this, void 0, void 0, function* () {
        return exports.authzProvider.getPermissionsForSystem(ctx, systemId, user);
    });
}
exports.getPermissionsForSystem = getPermissionsForSystem;
/**
 * Get a user's permission for a model, based on system and team, user role, and if the user owns the model.
 *
 * @param model
 * @param user
 * @returns
 */
function getPermissionsForModel(ctx, model, user) {
    return __awaiter(this, void 0, void 0, function* () {
        return exports.authzProvider.getPermissionsForStandaloneModel(ctx, model, user);
    });
}
exports.getPermissionsForModel = getPermissionsForModel;
/**
 * Asserts that user has required permissions for a model. Throws AuthzError if the user does not have permission.
 * Convenience function that wraps around other authz functions and fetches things automatically.
 *
 * @param modelService
 * @param modelId
 * @param user
 * @param requiredPermissions
 */
function hasPermissionsForModelId(ctx, dal, modelId, user, requiredPermissions) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = yield dal.modelService.getById(modelId);
        if (!model) {
            throw new errors_1.NotFoundError();
        }
        yield hasPermissionsForModel(ctx, model, user, requiredPermissions);
    });
}
exports.hasPermissionsForModelId = hasPermissionsForModelId;
/**
 * Asserts that user has required any of the required permissions for a model.
 * Throws AuthzError if the user does not have one of the permission.
 * Convenience function that wraps around other authz functions and fetches things automatically.
 *
 * @param modelService
 * @param modelId
 * @param user
 * @param requiredPermissions
 */
function hasAnyPermissionsForModelId(ctx, dal, modelId, user, requiredPermissions) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = yield dal.modelService.getById(modelId);
        if (!model) {
            throw new errors_1.NotFoundError();
        }
        yield hasAnyPermissionsForModel(ctx, model, user, requiredPermissions);
    });
}
exports.hasAnyPermissionsForModelId = hasAnyPermissionsForModelId;
/**
 * Asserts that user has the required permissions for a model.
 * Throws AuthzError if the user does not have the permission.
 * @param model
 * @param user
 * @param requiredPermissions
 */
function hasPermissionsForModel(ctx, model, user, requiredPermissions) {
    return __awaiter(this, void 0, void 0, function* () {
        const permissions = yield getPermissionsForModel(ctx, model, user);
        if (!requiredPermissions.every((ep) => permissions.includes(ep))) {
            throw new AuthzError_1.AuthzError(`User ${user.sub} is unauthorized for model ${model.id} systemId: ${model.systemId}. (${permissions.join(",")}) vs required: (${requiredPermissions.join(",")})`);
        }
    });
}
exports.hasPermissionsForModel = hasPermissionsForModel;
/**
 * Asserts that user has any of the required permissions for a model.
 * Throws AuthzError if the user does not have one of the permissions.
 * @param model
 * @param user
 * @param requiredPermissions
 */
function hasAnyPermissionsForModel(ctx, model, user, requiredPermissions) {
    return __awaiter(this, void 0, void 0, function* () {
        const permissions = yield getPermissionsForModel(ctx, model, user);
        if (!requiredPermissions.find((ep) => permissions.includes(ep))) {
            throw new AuthzError_1.AuthzError(`User ${user.sub} is unauthorized for model ${model.id} systemId: ${model.systemId}. (${permissions.join(",")}) vs required: (${requiredPermissions.join(",")})`);
        }
    });
}
exports.hasAnyPermissionsForModel = hasAnyPermissionsForModel;
/**
 * Asserts that user has required permissions for a model. Throws AuthzError if the user does not have permission.
 * Convenience function that wraps around other authz functions and fetches things automatically.
 *
 * @param modelService
 * @param modelId
 * @param user
 * @param requiredPermissions
 */
function hasPermissionsForSystemId(ctx, systemId, user, requiredPermissions) {
    return __awaiter(this, void 0, void 0, function* () {
        const permissions = yield getPermissionsForSystem(ctx, systemId, user);
        if (!requiredPermissions.every((ep) => permissions.includes(ep))) {
            throw new AuthzError_1.AuthzError(`User ${user.sub} is unauthorized for system systemId: ${systemId}. (${permissions.join(",")}) vs required: (${requiredPermissions.join(",")})`);
        }
    });
}
exports.hasPermissionsForSystemId = hasPermissionsForSystemId;
//# sourceMappingURL=authorization.js.map
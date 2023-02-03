import { DataAccessLayer } from "../data/dal";
import Model from "../data/models/Model";
import { RequestContext } from "../data/providers/RequestContext";
import { AuthzProvider } from "./AuthzProvider";
import { Role } from "./models/Role";
import { UserToken } from "./models/UserToken";
export declare const AllRoles: Role[];
export declare enum Permission {
    Read = "read",
    Write = "write",
    Delete = "delete",
    Review = "review"
}
export declare const AllPermissions: Permission[];
export interface Identity {
    id: string;
}
export declare let authzProvider: AuthzProvider;
export declare function setAuthorizationProvider(newAuthzProvider: AuthzProvider): void;
/**
 * Get a user's permissions for a system. Performs a lookup against Jira, so use sparingly.
 *
 * @param systemId
 * @param userTeams
 * @returns
 */
export declare function getPermissionsForSystem(ctx: RequestContext, systemId: string, user: UserToken): Promise<Permission[]>;
/**
 * Get a user's permission for a model, based on system and team, user role, and if the user owns the model.
 *
 * @param model
 * @param user
 * @returns
 */
export declare function getPermissionsForModel(ctx: RequestContext, model: Model, user: UserToken): Promise<Permission[]>;
/**
 * Asserts that user has required permissions for a model. Throws AuthzError if the user does not have permission.
 * Convenience function that wraps around other authz functions and fetches things automatically.
 *
 * @param modelService
 * @param modelId
 * @param user
 * @param requiredPermissions
 */
export declare function hasPermissionsForModelId(ctx: RequestContext, dal: DataAccessLayer, modelId: string, user: UserToken, requiredPermissions: Permission[]): Promise<void>;
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
export declare function hasAnyPermissionsForModelId(ctx: RequestContext, dal: DataAccessLayer, modelId: string, user: UserToken, requiredPermissions: Permission[]): Promise<void>;
/**
 * Asserts that user has the required permissions for a model.
 * Throws AuthzError if the user does not have the permission.
 * @param model
 * @param user
 * @param requiredPermissions
 */
export declare function hasPermissionsForModel(ctx: RequestContext, model: Model, user: UserToken, requiredPermissions: Permission[]): Promise<void>;
/**
 * Asserts that user has any of the required permissions for a model.
 * Throws AuthzError if the user does not have one of the permissions.
 * @param model
 * @param user
 * @param requiredPermissions
 */
export declare function hasAnyPermissionsForModel(ctx: RequestContext, model: Model, user: UserToken, requiredPermissions: Permission[]): Promise<void>;
/**
 * Asserts that user has required permissions for a model. Throws AuthzError if the user does not have permission.
 * Convenience function that wraps around other authz functions and fetches things automatically.
 *
 * @param modelService
 * @param modelId
 * @param user
 * @param requiredPermissions
 */
export declare function hasPermissionsForSystemId(ctx: RequestContext, systemId: string, user: UserToken, requiredPermissions: Permission[]): Promise<void>;
//# sourceMappingURL=authorization.d.ts.map
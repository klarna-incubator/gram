import { DataAccessLayer } from "../data/dal";
import Model from "../data/models/Model";
import { NotFoundError } from "../util/errors";
import { AuthzError } from "./AuthzError";
import { AuthzProvider } from "./AuthzProvider";
import { Reviewer } from "./models/Reviewer";
import { Role } from "./models/Role";
import { UserToken } from "./models/UserToken";

export const AllRoles = [Role.User, Role.Reviewer, Role.Admin];

export enum Permission {
  Read = "read",
  Write = "write",
  Delete = "delete",
  Review = "review",
}

export const AllPermissions = [
  Permission.Read,
  Permission.Write,
  Permission.Delete,
  Permission.Review,
];

export interface Identity {
  id: string;
}

/**
 * Default authorization provider, for now just throws errors.
 * Implementing orgs should add their own rules here.
 */
class DefaultAuthzProvider implements AuthzProvider {
  key = "default";
  err = "Method not implemented.";

  getPermissionsForSystem(
    systemId: string,
    user: UserToken
  ): Promise<Permission[]> {
    throw new Error(this.err);
  }
  getPermissionsForStandaloneModel(
    model: Model,
    user: UserToken
  ): Promise<Permission[]> {
    throw new Error(this.err);
  }
  getReviewersForModel(model: Model): Promise<Reviewer[]> {
    throw new Error(this.err);
  }
}

export let authzProvider: AuthzProvider = new DefaultAuthzProvider();
export function setAuthorizationProvider(newAuthzProvider: AuthzProvider) {
  authzProvider = newAuthzProvider;
}

/**
 * Get a user's permissions for a system. Performs a lookup against Jira, so use sparingly.
 *
 * @param systemId
 * @param userTeams
 * @returns
 */
export async function getPermissionsForSystem(
  systemId: string,
  user: UserToken
) {
  return authzProvider.getPermissionsForSystem(systemId, user);
}

/**
 * Get a user's permission for a model, based on system and team, user role, and if the user owns the model.
 *
 * @param model
 * @param user
 * @returns
 */
export async function getPermissionsForModel(model: Model, user: UserToken) {
  return authzProvider.getPermissionsForStandaloneModel(model, user);
}

/**
 * Asserts that user has required permissions for a model. Throws AuthzError if the user does not have permission.
 * Convenience function that wraps around other authz functions and fetches things automatically.
 *
 * @param modelService
 * @param modelId
 * @param user
 * @param requiredPermissions
 */
export async function hasPermissionsForModelId(
  dal: DataAccessLayer,
  modelId: string,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const model = await dal.modelService.getById(modelId);

  if (!model) {
    throw new NotFoundError();
  }

  await hasPermissionsForModel(model, user, requiredPermissions);
}

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
export async function hasAnyPermissionsForModelId(
  dal: DataAccessLayer,
  modelId: string,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const model = await dal.modelService.getById(modelId);

  if (!model) {
    throw new NotFoundError();
  }

  await hasAnyPermissionsForModel(model, user, requiredPermissions);
}

/**
 * Asserts that user has the required permissions for a model.
 * Throws AuthzError if the user does not have the permission.
 * @param model
 * @param user
 * @param requiredPermissions
 */
export async function hasPermissionsForModel(
  model: Model,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const permissions = await getPermissionsForModel(model, user);

  if (!requiredPermissions.every((ep) => permissions.includes(ep))) {
    throw new AuthzError(
      `User ${user.sub} is unauthorized for model ${model.id} systemId: ${
        model.systemId
      }. (${permissions.join(",")}) vs required: (${requiredPermissions.join(
        ","
      )})`
    );
  }
}

/**
 * Asserts that user has any of the required permissions for a model.
 * Throws AuthzError if the user does not have one of the permissions.
 * @param model
 * @param user
 * @param requiredPermissions
 */
export async function hasAnyPermissionsForModel(
  model: Model,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const permissions = await getPermissionsForModel(model, user);

  if (!requiredPermissions.find((ep) => permissions.includes(ep))) {
    throw new AuthzError(
      `User ${user.sub} is unauthorized for model ${model.id} systemId: ${
        model.systemId
      }. (${permissions.join(",")}) vs required: (${requiredPermissions.join(
        ","
      )})`
    );
  }
}

/**
 * Asserts that user has required permissions for a model. Throws AuthzError if the user does not have permission.
 * Convenience function that wraps around other authz functions and fetches things automatically.
 *
 * @param modelService
 * @param modelId
 * @param user
 * @param requiredPermissions
 */
export async function hasPermissionsForSystemId(
  systemId: string,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const permissions = await getPermissionsForSystem(systemId, user);

  if (!requiredPermissions.every((ep) => permissions.includes(ep))) {
    throw new AuthzError(
      `User ${
        user.sub
      } is unauthorized for system systemId: ${systemId}. (${permissions.join(
        ","
      )}) vs required: (${requiredPermissions.join(",")})`
    );
  }
}

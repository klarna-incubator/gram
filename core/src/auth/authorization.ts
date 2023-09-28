import { DataAccessLayer } from "../data/dal.js";
import Model from "../data/models/Model.js";
import { RequestContext } from "../data/providers/RequestContext.js";
import { NotFoundError } from "../util/errors.js";
import { AuthzError } from "./AuthzError.js";
import { AuthzProvider } from "./AuthzProvider.js";
import { DefaultAuthzProvider } from "./DefaultAuthzProvider.js";
import { DummyAuthzProvider } from "./DummyAuthzProvider.js";
import { Role } from "./models/Role.js";
import { UserToken } from "./models/UserToken.js";

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

export let authzProvider: AuthzProvider = new DummyAuthzProvider();
export function setAuthorizationProvider(newAuthzProvider: AuthzProvider) {
  authzProvider = newAuthzProvider;
}

/**
 * Get a user's permissions for a system.
 *
 * @param systemId
 * @param userTeams
 * @returns
 */
export async function getPermissionsForSystem(
  ctx: RequestContext,
  systemId: string,
  user: UserToken
) {
  return authzProvider.getPermissionsForSystem(ctx, systemId, user);
}

/**
 * Get a user's permission for a model, based on system and team, user role, and if the user owns the model.
 *
 * @param model
 * @param user
 * @returns
 */
export async function getPermissionsForModel(
  ctx: RequestContext,
  model: Model,
  user: UserToken
) {
  return authzProvider.getPermissionsForStandaloneModel(ctx, model, user);
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
  ctx: RequestContext,
  dal: DataAccessLayer,
  modelId: string,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const model = await dal.modelService.getById(modelId);

  if (!model) {
    throw new NotFoundError();
  }

  await hasPermissionsForModel(ctx, model, user, requiredPermissions);
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
  ctx: RequestContext,
  dal: DataAccessLayer,
  modelId: string,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const model = await dal.modelService.getById(modelId);

  if (!model) {
    throw new NotFoundError();
  }

  await hasAnyPermissionsForModel(ctx, model, user, requiredPermissions);
}

/**
 * Asserts that user has the required permissions for a model.
 * Throws AuthzError if the user does not have the permission.
 * @param model
 * @param user
 * @param requiredPermissions
 */
export async function hasPermissionsForModel(
  ctx: RequestContext,
  model: Model,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const permissions = await getPermissionsForModel(ctx, model, user);

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
  ctx: RequestContext,
  model: Model,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const permissions = await getPermissionsForModel(ctx, model, user);

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
  ctx: RequestContext,
  systemId: string,
  user: UserToken,
  requiredPermissions: Permission[]
) {
  const permissions = await getPermissionsForSystem(ctx, systemId, user);

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

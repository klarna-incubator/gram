import { DataAccessLayer } from "../data/dal.js";
import Model from "../data/models/Model.js";
import { RequestContext } from "../data/providers/RequestContext.js";
import { ReviewStatus } from "../data/reviews/Review.js";
import { systemProvider } from "../data/systems/systems.js";
import { AuthzProvider } from "./AuthzProvider.js";
import { AllPermissions, Permission } from "./authorization.js";
import { Role } from "./models/Role.js";
import { UserToken } from "./models/UserToken.js";

export class DefaultAuthzProvider implements AuthzProvider {
  constructor(protected dal: DataAccessLayer) {}

  async getPermissionsForSystem(
    ctx: RequestContext,
    systemId: string,
    user: UserToken
  ): Promise<Permission[]> {
    if (user.roles.length === 0) return [];

    /**
     * Admins have full permission
     */
    if (user.roles.find((r) => r === Role.Admin)) return AllPermissions;

    const permissions: Permission[] = [];

    /**
     * Reviewers may review any model
     */
    if (user.roles.find((r) => r === Role.Reviewer)) {
      /**
       * TODO: give write permission only if reviewer is assigned to the model.
       */
      permissions.push(Permission.Read, Permission.Write, Permission.Review);
    }

    /**
     * Regular users may read any model
     */
    if (user.roles.find((r) => r === Role.User)) {
      permissions.push(Permission.Read);
    }

    /**
     * System owners, determined by team, may modify the model
     */
    const system = await systemProvider.getSystem(ctx, systemId);
    if (user.teams.find((t) => system?.owners?.find((o) => o.id === t.id))) {
      permissions.push(Permission.Write, Permission.Delete);
    }

    return permissions;
  }

  async getPermissionsForStandaloneModel(
    ctx: RequestContext,
    model: Model,
    user: UserToken
  ): Promise<Permission[]> {
    const review = await this.dal.reviewService.getByModelId(model.id!);
    if (model.systemId) {
      let systemPermissions = await this.getPermissionsForSystem(
        ctx,
        model.systemId,
        user
      );
      if (review?.status === ReviewStatus.Approved) {
        systemPermissions = systemPermissions.filter(
          (p) => p !== Permission.Write
        );
      }
      return systemPermissions;
    }

    if (user.roles.length === 0) return [];

    const permissions: Set<Permission> = new Set();

    if (user.roles.find((r) => r === Role.Admin)) {
      AllPermissions.forEach((p) => permissions.add(p));
    }

    /**
     * Standalone models are mainly used for training. To avoid authz issues here we allow most things
     * by most users. Ideally here there should be some sharing system.
     */
    if (user.roles.find((r) => r === Role.Reviewer)) {
      [Permission.Read, Permission.Review, Permission.Write].forEach((p) =>
        permissions.add(p)
      );
    }

    if (user.roles.find((r) => r === Role.User)) {
      [Permission.Read, Permission.Write].forEach((p) => permissions.add(p));
    }

    if (model.createdBy === user.sub) {
      [Permission.Read, Permission.Write, Permission.Delete].forEach((p) =>
        permissions.add(p)
      );
    }

    if (review?.status === ReviewStatus.Approved) {
      permissions.delete(Permission.Write);
    }

    return [...permissions];
  }

  async getRolesForUser(sub: string): Promise<Role[]> {
    return [Role.User];
  }

  key = "default";
}

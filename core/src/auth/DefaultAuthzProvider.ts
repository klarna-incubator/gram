import Model from "../data/models/Model";
import { RequestContext } from "../data/providers/RequestContext";
import { systemProvider } from "../data/systems/systems";
import { AuthzProvider } from "./AuthzProvider";
import { AllPermissions, Permission } from "./authorization";
import { Role } from "./models/Role";
import { UserToken } from "./models/UserToken";

export class DefaultAuthzProvider implements AuthzProvider {
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
      permissions.push(Permission.Read, Permission.Review);
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
    if (
      model.systemId &&
      model.systemId != "00000000-0000-0000-0000-000000000000"
    ) {
      return this.getPermissionsForSystem(ctx, model.systemId, user);
    }

    if (user.roles.length === 0) return [];

    if (user.roles.find((r) => r === Role.Admin)) return AllPermissions;

    const permissions: Permission[] = [];

    if (user.roles.find((r) => r === Role.Reviewer)) {
      permissions.push(Permission.Read, Permission.Review);
    }

    if (user.roles.find((r) => r === Role.User)) {
      permissions.push(Permission.Read);
    }

    if (model.createdBy === user.sub) {
      permissions.push(Permission.Read, Permission.Write, Permission.Delete);
    }

    return permissions;
  }

  async getRolesForUser(sub: string): Promise<Role[]> {
    return [Role.User];
  }

  key = "default";
}

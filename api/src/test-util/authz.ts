import { AllPermissions, Permission } from "../auth/authorization";
import { AuthzProvider } from "../auth/AuthzProvider";
import { Role } from "../auth/models/Role";
import { UserToken } from "../auth/models/UserToken";
import Model from "../data/models/Model";
import { getMockedSystemById } from "./system";
import { sampleReviewer, sampleUser } from "./sampleUser";
import { Reviewer } from "../auth/models/Reviewer";
import { RequestContext } from "../data/providers/RequestContext";

export const genUser = (user?: Partial<UserToken>): UserToken => ({
  ...sampleUser,
  ...user,
});

// Maybe this should be the default?
class TestAuthzProvider implements AuthzProvider {
  async getPermissionsForSystem(
    ctx: RequestContext,
    systemId: string,
    user: UserToken
  ): Promise<Permission[]> {
    if (user.roles.length === 0) return [];
    if (user.roles.find((r) => r === Role.Admin)) return AllPermissions;

    const permissions: Permission[] = [];

    if (user.roles.find((r) => r === Role.Reviewer)) {
      permissions.push(Permission.Read, Permission.Review);
    }

    if (user.roles.find((r) => r === Role.User)) {
      permissions.push(Permission.Read);
    }

    const system = await getMockedSystemById(systemId);
    if (user.teams.find((t) => system?.owners?.find((o) => o.id === t.id))) {
      permissions.push(Permission.Write, Permission.Delete);
    }

    // console.log(permissions);

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

    // console.log(permissions);

    return permissions;
  }
  key = "test";
}

export const testAuthzProvider = new TestAuthzProvider();

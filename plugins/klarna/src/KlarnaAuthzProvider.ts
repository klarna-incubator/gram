import { AllPermissions, Permission } from "@gram/core/dist/auth/authorization";
import { AuthzProvider } from "@gram/core/dist/auth/AuthzProvider";
import { Role } from "@gram/core/dist/auth/models/Role";
import { UserToken } from "@gram/core/dist/auth/models/UserToken";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import Model from "@gram/core/dist/data/models/Model";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { ReviewStatus } from "@gram/core/dist/data/reviews/Review";
import { OctaneSystemProvider } from "./system/OctaneSystemProvider";

export class KlarnaAuthzProvider implements AuthzProvider {
  key = "klarna-authz";

  constructor(
    private dal: DataAccessLayer,
    private systemProvider: OctaneSystemProvider
  ) {}

  getPermissionsForStandaloneModel(
    ctx: RequestContext,
    model: Model,
    user: UserToken
  ): Promise<Permission[]> {
    return this.getPermissionsForModel(model, user);
  }

  async systemOwner(systemId: string, user: UserToken) {
    const system = await this.systemProvider.getOctaneSystem(systemId);
    return user.teams.find(
      (team) => team.id === system?.team?.accountability_code
    );
  }

  async getPermissionsForSystem(
    ctx: RequestContext,
    systemId: string,
    user: UserToken
  ): Promise<Permission[]> {
    // No roles
    if (user.roles.length === 0) {
      return [];
    }

    const perms = new Set<Permission>();

    // Check Ownership
    if (await this.systemOwner(systemId, user)) {
      [Permission.Read, Permission.Write, Permission.Delete].map((p) =>
        perms.add(p)
      );
    }

    // Allow admins all permissions. Run this after to ensure lookup is still done, so we admins get the same user experience.
    if (user.roles.includes(Role.Admin)) {
      return AllPermissions;
    }

    // Allow reviewers read and review access
    if (user.roles.includes(Role.Reviewer)) {
      [Permission.Read, Permission.Review].map((p) => perms.add(p));
    }

    // Allow any logged in user read access, for transparency
    if (user.roles.includes(Role.User)) {
      perms.add(Permission.Read);
    }

    // Default to no access
    return Array.from(perms);
  }

  async getPermissionsForModel(
    model: Model,
    user: UserToken
  ): Promise<Permission[]> {
    const perms = new Set<Permission>();
    const review = model.id
      ? await this.dal.reviewService.getByModelId(model.id)
      : null;

    // No roles
    if (user.roles.length === 0) {
      return [];
    }

    // Check Reviewer
    if (user.roles.includes(Role.Reviewer)) {
      [Permission.Read, Permission.Review].map((p) => perms.add(p));
    }

    if (
      model.systemId &&
      model.systemId !== "00000000-0000-0000-0000-000000000000"
    ) {
      [...(await this.getPermissionsForSystem({}, model.systemId, user))].map(
        (p) => perms.add(p)
      );
    } else if (model.createdBy === user.sub) {
      [Permission.Read, Permission.Write, Permission.Delete].map((p) =>
        perms.add(p)
      );
    } else {
      // Temporary workaround to allow users to modify other user's non-system models.
      [Permission.Read, Permission.Write, Permission.Delete].map((p) =>
        perms.add(p)
      );
    }

    // Allow any logged in user read access, for transparency
    if (user.roles.includes(Role.User)) {
      perms.add(Permission.Read);
    }

    // Check Admin. I put this last to emulate the slowdown that a normal user would have. Otherwise we would not fetch
    // from Jira.
    if (user.roles.includes(Role.Admin)) {
      AllPermissions.map((p) => perms.add(p));
    }

    // Remove WRITE permission for all roles when model has been approved
    if (review?.status === ReviewStatus.Approved) {
      perms.delete(Permission.Write);
    }

    // Only allow reviews by the assigned reviewer (or Admin)
    if (!user.roles.includes(Role.Admin) && review?.reviewedBy !== user.sub) {
      perms.delete(Permission.Review);
    }

    return Array.from(perms);
  }
}

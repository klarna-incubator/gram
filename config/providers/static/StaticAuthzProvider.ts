import { DefaultAuthzProvider } from "@gram/core/dist/auth/DefaultAuthzProvider.js";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export class StaticAuthzProvider extends DefaultAuthzProvider {
  key: string = "static";
  constructor(
    dal: DataAccessLayer,
    public users: string[],
    public reviewers: string[],
    public admins: string[]
  ) {
    super(dal);
  }

  async getRolesForUser(sub: string): Promise<Role[]> {
    const roles: Role[] = [];

    if (this.admins.includes(sub)) {
      roles.push(Role.Admin);
    }
    if (this.reviewers.includes(sub)) {
      roles.push(Role.Reviewer);
    }
    if (this.users.includes(sub)) {
      roles.push(Role.User);
    }

    return roles;
  }
}

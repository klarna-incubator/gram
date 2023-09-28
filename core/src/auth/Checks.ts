import { Role } from "../auth/models/Role.js";
import { UserToken } from "../auth/models/UserToken.js";

export class Checks {
  user: UserToken;

  constructor(user: UserToken) {
    this.user = user;
  }

  public any(...roles: Role[]) {
    if (roles.length === 0) return true;
    for (let i = 0; i < roles.length; i++) {
      if (this.user.roles.indexOf(roles[i]) > -1) return true;
    }
    return false;
  }

  public all(...roles: Role[]) {
    return roles.every((role) => this.is(role));
  }

  public is(role: Role) {
    return this.user.roles.includes(role);
  }
}

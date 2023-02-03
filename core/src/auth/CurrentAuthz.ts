import {
  hasPermissionsForModel,
  hasPermissionsForModelId,
  hasPermissionsForSystemId,
  getPermissionsForModel,
  Permission,
  hasAnyPermissionsForModelId,
} from "../auth/authorization";
import { Role } from "../auth/models/Role";
import { AuthzError } from "../auth/AuthzError";
import { UserToken } from "../auth/models/UserToken";
import Model from "../data/models/Model";
import { DataAccessLayer } from "../data/dal";
import { GramRequest } from "../data/providers/RequestContext";
import { Checks } from "./Checks";

/**
 * Current User's Authorization. Interface on the GramRequest level to
 * check for authorization.
 */

export class CurrentAuthz {
  public user: UserToken;
  public check: Checks;

  constructor(private req: GramRequest, private dal: DataAccessLayer) {
    this.user = req.user;
    this.dal = dal;
    this.check = new Checks(req.user);
  }

  public any(...roles: Role[]) {
    if (!this.check.any(...roles))
      throw new AuthzError(
        `required any role: ${roles}, but user had roles ${this.user.roles}`
      );
  }

  public all(...roles: Role[]) {
    if (!this.check.all(...roles))
      throw new AuthzError(
        `required all role: ${roles}, but user had roles ${this.user.roles}`
      );
  }

  public is(role: Role) {
    if (!this.check.is(role))
      throw new AuthzError(
        `required role: ${role}, but user had roles ${this.user.roles}`
      );
  }

  public async hasPermissionsForModelId(
    modelId: string,
    ...expectedPermissions: Permission[]
  ) {
    await hasPermissionsForModelId(
      { currentRequest: this.req },
      this.dal,
      modelId,
      this.user,
      expectedPermissions
    );
  }

  public async hasAnyPermissionsForModelId(
    modelId: string,
    ...anyOfThesePermissions: Permission[]
  ) {
    await hasAnyPermissionsForModelId(
      { currentRequest: this.req },
      this.dal,
      modelId,
      this.user,
      anyOfThesePermissions
    );
  }

  public async hasPermissionsForModel(
    model: Model,
    ...expectedPermissions: Permission[]
  ) {
    await hasPermissionsForModel(
      { currentRequest: this.req },
      model,
      this.user,
      expectedPermissions
    );
  }

  public async hasPermissionsForSystemId(
    systemId: string,
    ...expectedPermissions: Permission[]
  ) {
    await hasPermissionsForSystemId(
      { currentRequest: this.req },
      systemId,
      this.user,
      expectedPermissions
    );
  }

  public async getPermissionsForModel(model: Model) {
    return await getPermissionsForModel(
      { currentRequest: this.req },
      model,
      this.user
    );
  }
}

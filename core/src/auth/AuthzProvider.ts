import Model from "../data/models/Model.js";
import { RequestContext } from "../data/providers/RequestContext.js";
import { Provider } from "../data/providers/Provider.js";
import { Permission } from "./authorization.js";
import { UserToken } from "./models/UserToken.js";
import { Role } from "./models/Role.js";

/**
 * The AuthzProvider provides authorizations. It is the central point
 * for Gram to decide who is allowed to do what.
 */
export interface AuthzProvider extends Provider {
  getPermissionsForSystem(
    ctx: RequestContext,
    systemId: string,
    user: UserToken
  ): Promise<Permission[]>;
  getPermissionsForStandaloneModel(
    ctx: RequestContext,
    model: Model,
    user: UserToken
  ): Promise<Permission[]>;
  getRolesForUser(sub: string): Promise<Role[]>;
}

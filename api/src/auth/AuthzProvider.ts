import Model from "../data/models/Model";
import { Provider } from "../util/provider";
import { Permission } from "./authorization";
import { UserToken } from "./models/UserToken";

/**
 * The AuthzProvider provides authorizations. It is the central point
 * for Gram to decide who is allowed to do what.
 */
export interface AuthzProvider extends Provider {
  getPermissionsForSystem(
    systemId: string,
    user: UserToken
  ): Promise<Permission[]>;
  getPermissionsForStandaloneModel(
    model: Model,
    user: UserToken
  ): Promise<Permission[]>;
}

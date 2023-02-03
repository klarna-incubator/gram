import Model from "../data/models/Model";
import { RequestContext } from "../data/providers/RequestContext";
import { Provider } from "../data/providers/Provider";
import { Permission } from "./authorization";
import { UserToken } from "./models/UserToken";
/**
 * The AuthzProvider provides authorizations. It is the central point
 * for Gram to decide who is allowed to do what.
 */
export interface AuthzProvider extends Provider {
    getPermissionsForSystem(ctx: RequestContext, systemId: string, user: UserToken): Promise<Permission[]>;
    getPermissionsForStandaloneModel(ctx: RequestContext, model: Model, user: UserToken): Promise<Permission[]>;
}
//# sourceMappingURL=AuthzProvider.d.ts.map
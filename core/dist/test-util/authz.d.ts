import { Permission } from "../auth/authorization";
import { AuthzProvider } from "../auth/AuthzProvider";
import { UserToken } from "../auth/models/UserToken";
import Model from "../data/models/Model";
import { RequestContext } from "../data/providers/RequestContext";
export declare const genUser: (user?: Partial<UserToken>) => UserToken;
declare class TestAuthzProvider implements AuthzProvider {
    getPermissionsForSystem(ctx: RequestContext, systemId: string, user: UserToken): Promise<Permission[]>;
    getPermissionsForStandaloneModel(ctx: RequestContext, model: Model, user: UserToken): Promise<Permission[]>;
    key: string;
}
export declare const testAuthzProvider: TestAuthzProvider;
export {};
//# sourceMappingURL=authz.d.ts.map
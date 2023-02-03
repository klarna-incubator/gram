import { Permission } from "@gram/core/dist/auth/authorization";
import { AuthzProvider } from "@gram/core/dist/auth/AuthzProvider";
import { UserToken } from "@gram/core/dist/auth/models/UserToken";
import Model from "@gram/core/dist/data/models/Model";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
export declare const genUser: (user?: Partial<UserToken>) => UserToken;
declare class TestAuthzProvider implements AuthzProvider {
    getPermissionsForSystem(ctx: RequestContext, systemId: string, user: UserToken): Promise<Permission[]>;
    getPermissionsForStandaloneModel(ctx: RequestContext, model: Model, user: UserToken): Promise<Permission[]>;
    key: string;
}
export declare const testAuthzProvider: TestAuthzProvider;
export {};
//# sourceMappingURL=authz.d.ts.map
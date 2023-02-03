import { Permission } from "../auth/authorization";
import { Role } from "../auth/models/Role";
import { UserToken } from "../auth/models/UserToken";
import Model from "../data/models/Model";
import { DataAccessLayer } from "../data/dal";
import { GramRequest } from "../data/providers/RequestContext";
import { Checks } from "./Checks";
/**
 * Current User's Authorization. Interface on the GramRequest level to
 * check for authorization.
 */
export declare class CurrentAuthz {
    private req;
    private dal;
    user: UserToken;
    check: Checks;
    constructor(req: GramRequest, dal: DataAccessLayer);
    any(...roles: Role[]): void;
    all(...roles: Role[]): void;
    is(role: Role): void;
    hasPermissionsForModelId(modelId: string, ...expectedPermissions: Permission[]): Promise<void>;
    hasAnyPermissionsForModelId(modelId: string, ...anyOfThesePermissions: Permission[]): Promise<void>;
    hasPermissionsForModel(model: Model, ...expectedPermissions: Permission[]): Promise<void>;
    hasPermissionsForSystemId(systemId: string, ...expectedPermissions: Permission[]): Promise<void>;
    getPermissionsForModel(model: Model): Promise<Permission[]>;
}
//# sourceMappingURL=CurrentAuthz.d.ts.map
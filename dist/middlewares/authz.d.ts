import { NextFunction, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { GramRequest } from "@gram/core/dist/data/providers/RequestContext";
import { CurrentAuthz } from "@gram/core/dist/auth/CurrentAuthz";
export interface AuthzMiddlewareOptions {
    dal: DataAccessLayer;
}
interface AuthzMiddlewareFunction {
    authz: Authz;
    (req: GramRequest, resp: Response, next: NextFunction): void;
    is<Role>(role: Role): (req: GramRequest, resp: Response, next: NextFunction) => void;
    all<Role>(...roles: [Role]): (req: GramRequest, resp: Response, next: NextFunction) => void;
    any<Role>(...roles: [Role]): (req: GramRequest, resp: Response, next: NextFunction) => void;
}
export declare function AuthzMiddleware(options: AuthzMiddlewareOptions): AuthzMiddlewareFunction;
export declare class Authz {
    options: AuthzMiddlewareOptions;
    constructor(options: AuthzMiddlewareOptions);
    handleRequest(req: GramRequest): CurrentAuthz;
}
export {};
//# sourceMappingURL=authz.d.ts.map
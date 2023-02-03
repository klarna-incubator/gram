/**
 * Auth middleware
 * @exports auth
 */
import { NextFunction, Response } from "express";
export declare function validateTokenMiddleware(req: any, res: Response, next: NextFunction): Promise<void>;
export declare function authRequiredMiddleware(req: any, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.d.ts.map
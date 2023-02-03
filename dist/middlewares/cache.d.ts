/**
 * Cache middleware, caches requests globally (i.e. dont cache user data with this!)
 * @exports cache
 */
import { NextFunction, Request, Response } from "express";
/**
 * @returns {*} middleware
 */
declare function cache(): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export default cache;
//# sourceMappingURL=cache.d.ts.map
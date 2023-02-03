/**
 * Logger middleware
 * @exports logger
 */
import { NextFunction, Response } from "express";
/**
 * @param {object} opts
 * @returns {*} middleware
 */
declare function logger(opts: any): (req: any, res: Response, next: NextFunction) => Promise<void>;
export default logger;
//# sourceMappingURL=logger.d.ts.map
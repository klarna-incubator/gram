/**
 * GET /api/v1/models
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
export declare function list(dal: DataAccessLayer): (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=list.d.ts.map
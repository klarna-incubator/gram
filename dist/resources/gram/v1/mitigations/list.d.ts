import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
/**
 * GET /api/v1/models/{modelId}/mitigations
 * @exports {function} handler
 */
export declare function list(dal: DataAccessLayer): (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=list.d.ts.map
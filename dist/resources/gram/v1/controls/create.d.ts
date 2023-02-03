/**
 * POST /api/v1/models/{modelId}/components/{componentId}/threats/{threatId}/controls/create
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
export declare function create(dal: DataAccessLayer): (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=create.d.ts.map
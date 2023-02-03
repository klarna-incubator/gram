/**
 * PATCH /api/v1/suggestions/{modelId}/accept
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
export default function accept(dal: DataAccessLayer): (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=accept.d.ts.map
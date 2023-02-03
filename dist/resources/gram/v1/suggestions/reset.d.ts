/**
 * PATCH /api/v1/suggestions/{modelId}/reset
 *
 * Used to e.g. undo rejected/ignored suggestions
 *
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
export default function reset(dal: DataAccessLayer): (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=reset.d.ts.map
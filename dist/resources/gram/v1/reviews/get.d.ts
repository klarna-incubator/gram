import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
/**
 * GET /api/v1/reviews/{modelId}
 * @exports {function} handler
 */
declare const _default: (dal: DataAccessLayer) => (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export default _default;
//# sourceMappingURL=get.d.ts.map
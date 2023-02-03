/**
 * PATCH /api/v1/reviews/{id}
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
declare const _default: (dal: DataAccessLayer) => (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export default _default;
//# sourceMappingURL=requestMeeting.d.ts.map
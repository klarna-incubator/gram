/**
 * GET /api/v1/models/<id>/set-template
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService";
declare const _default: (dataModels: ModelDataService) => (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export default _default;
//# sourceMappingURL=setTemplate.d.ts.map
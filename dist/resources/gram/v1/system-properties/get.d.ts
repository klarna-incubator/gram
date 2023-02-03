/**
 * GET /api/v1/models/{id}
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService";
import { SystemPropertyHandler } from "@gram/core/dist/data/system-property/SystemPropertyHandler";
export declare function getProperties(sysPropHandler: SystemPropertyHandler, dataModels: ModelDataService): (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=get.d.ts.map
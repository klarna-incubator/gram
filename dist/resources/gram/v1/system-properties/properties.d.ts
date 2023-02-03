/**
 * GET /api/v1/system-properties
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { SystemPropertyHandler } from "@gram/core/dist/data/system-property/SystemPropertyHandler";
export declare function listProperties(sysPropHandler: SystemPropertyHandler): (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=properties.d.ts.map
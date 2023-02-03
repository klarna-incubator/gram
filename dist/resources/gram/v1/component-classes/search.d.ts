/**
 * GET /api/v1/component-classes/?type=datastore&search=S3
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { ComponentClassHandler } from "@gram/core/dist/data/component-classes";
export declare const searchClasses: (ccHandler: ComponentClassHandler) => (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=search.d.ts.map
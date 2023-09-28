/**
 * GET /api/v1/system-properties
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export function listProperties(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const ctx: RequestContext = { currentRequest: req };
    const properties = await dal.sysPropHandler.getProperties(ctx);
    return res.json({ properties });
  };
}

/**
 * GET /api/v1/system-properties
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { SystemPropertyHandler } from "../../../../data/system-property";

export function listProperties(sysPropHandler: SystemPropertyHandler) {
  return async (req: Request, res: Response) => {
    const properties = sysPropHandler.getProperties();
    return res.json({ properties });
  };
}

/**
 * GET /api/v1/reports/system-compliance
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { DataAccessLayer } from "../../../../data/dal";

export function listSystemCompliance(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const page = req.query["page"]
      ? parseInt(req.query["page"] as string)
      : undefined;
    const pagesize = req.query["pagesize"]
      ? parseInt(req.query["pagesize"] as string)
      : undefined;

    const report = await dal.reportService.listSystemCompliance(
      { currentRequest: req },
      pagesize,
      page
    );
    return res.json(report);
  };
}

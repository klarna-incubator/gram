/**
 * GET /api/v1/models/<id>/compliance
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const compliances = await dal.reviewService.getComplianceForSystems([
      id.toString(),
    ]);

    if (compliances.length === 0) {
      return res.sendStatus(404);
    }

    return res.json({
      compliance: compliances[0],
    });
  };

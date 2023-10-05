/**
 * PATCH /api/v1/reviews/{id}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { modelId } = req.params;

    const unsupportedArgs = Object.keys(req.body).find(
      (e) => e !== "note" && e !== "reviewedBy"
    );
    if (unsupportedArgs) {
      res
        .status(400)
        .send(
          `Parameter ${unsupportedArgs} is not supported on this endpoint.`
        );
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Review);
    const review = await dal.reviewService.update(modelId, {
      note: req.body.note,
      reviewedBy: req.body.reviewedBy,
    });

    if (!review) {
      res.sendStatus(500);
    }

    return res.json({ review });
  };

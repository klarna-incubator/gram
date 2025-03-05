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

    await req.authz.hasPermissionsForModelId(modelId, Permission.Review);

    const note = req.body?.note;

    const result = await dal.reviewService.decline(
      { currentRequest: req },
      modelId,
      note
    );

    res.json({ result });
  };

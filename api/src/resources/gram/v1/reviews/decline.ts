/**
 * PATCH /api/v1/reviews/{id}
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { DataAccessLayer } from "../../../../data/dal";

export default (dal: DataAccessLayer) => async (req: Request, res: Response) => {
  const { modelId } = req.params;
  const note = req.body.note;

  await req.authz.hasPermissionsForModelId(modelId, Permission.Review);
  const result = await dal.reviewService.decline(
    { currentRequest: req },
    modelId,
    note
  );

  return res.json({ result });
};

import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { DataAccessLayer } from "../../../../data/dal";

/**
 * GET /api/v1/models/{modelId}/controls
 * @exports {function} handler
 */
export function list(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;
    if (!modelId) {
      return res.sendStatus(400);
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);
    const controls = await dal.controlService.list(modelId);

    return res.json({ controls });
  };
}

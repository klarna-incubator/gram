import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

/**
 * GET /api/v1/models/{modelId}/controls
 * @exports {function} handler
 */
export function list(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;
    if (!modelId) {
      res.sendStatus(400);
      return;
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);
    const controls = await dal.controlService.list(modelId);

    res.json({ controls });
    return;
  };
}

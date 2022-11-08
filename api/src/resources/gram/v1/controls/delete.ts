/**
 * DELETE /api/v1/models/{modelId}/components/{componentId}/threats/{threatId}/controls/{id}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { DataAccessLayer } from "../../../../data/dal";

export function _delete(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId, id } = req.params;
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    const result = await dal.controlService.delete(modelId, id);
    return res.json({ deleted: result });
  };
}

/**
 * DELETE /api/v1/models/{modelId}/components/{componentId}/threats/{threatId}/controls/{id}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export function _delete(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId, id } = req.params;
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    const result = await dal.controlService.delete(modelId, id);
    res.json({ deleted: result });
    return;
  };
}

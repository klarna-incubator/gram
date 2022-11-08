/**
 * PATCH /api/v1/models/{modelId}/components/{componentId}/threats/{threatId}/controls/{id}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { DataAccessLayer } from "../../../../data/dal";

export function update(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId, threatId } = req.params;
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    const result = await dal.threatService.update(modelId, threatId, req.body);
    return res.json({ result });
  };
}

/**
 * PATCH /api/v1/models/{modelId}/components/{componentId}/threats/{threatId}/controls/{id}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export function update(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId, threatId } = req.params;
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    const result = await dal.threatService.update(modelId, threatId, req.body);
    res.json({ result });
  };
}

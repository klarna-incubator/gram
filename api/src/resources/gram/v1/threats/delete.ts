/**
 * DELETE /api/v1/threat
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization";
import { DataAccessLayer } from "@gram/core/dist/data/dal";

export function _delete(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { threatId, modelId } = req.params;
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    await dal.threatService.delete(modelId, threatId);
    return res.json({ status: "ok" });
  };
}

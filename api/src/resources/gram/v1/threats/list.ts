/**
 * GET /api/v1/models
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization";
import { DataAccessLayer } from "@gram/core/dist/data/dal";

export function list(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;
    if (!modelId) {
      return res.sendStatus(400);
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);
    const threats = await dal.threatService.list(modelId);

    return res.json({ threats });
  };
}

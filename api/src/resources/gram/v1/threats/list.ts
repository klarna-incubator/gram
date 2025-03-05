/**
 * GET /api/v1/models
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export function list(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;
    if (!modelId) {
      res.sendStatus(400);
      return;
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);
    const threats = await dal.threatService.list(modelId);

    res.json({ threats });
    return;
  };
}

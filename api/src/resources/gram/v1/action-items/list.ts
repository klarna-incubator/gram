import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export function listActionItems(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;
    if (!modelId) {
      res.sendStatus(400);
      return;
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);
    const actionItems = await dal.threatService.listActionItems(modelId);

    res.json({ actionItems });
    return;
  };
}

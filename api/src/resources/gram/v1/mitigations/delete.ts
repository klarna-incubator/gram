import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ensureControlAndThreatPermission } from "./util.js";

export function _delete(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;
    const { threatId, controlId } = req.body;

    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    await ensureControlAndThreatPermission(dal, modelId, controlId, threatId);

    const result = await dal.mitigationService.delete(threatId, controlId);
    res.json({ deleted: result });
    return;
  };
}

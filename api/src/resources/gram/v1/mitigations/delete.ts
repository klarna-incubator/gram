import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { DataAccessLayer } from "../../../../data/dal";
import { ensureControlAndThreatPermission } from "./util";

export function _delete(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;
    const { threatId, controlId } = req.body;

    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    await ensureControlAndThreatPermission(dal, modelId, controlId, threatId);

    const result = await dal.mitigationService.delete(threatId, controlId);
    return res.json({ deleted: result });
  };
}

/**
 * POST /api/v1/models/{modelId}/mitigation
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { getLogger } from "log4js";
import { Permission } from "../../../../auth/authorization";
import { AuthzError } from "../../../../auth/AuthzError";
import { DataAccessLayer } from "../../../../data/dal";
import Mitigation from "../../../../data/mitigations/Mitigation";
import { MitigationDataService } from "../../../../data/mitigations/MitigationDataService";
import { validateUUID } from "../../../../util/uuid";
import { ensureControlAndThreatPermission } from "./util";

export function create(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { threatId, controlId } = req.body;
    const { modelId } = req.params;

    if (
      !validateUUID(modelId) ||
      !validateUUID(threatId) ||
      !validateUUID(controlId)
    ) {
      return res
        .json({
          message: "modelId, threatId and controlId must be valid UUIDs",
        })
        .sendStatus(400);
    }

    // Check authz
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    await ensureControlAndThreatPermission(dal, modelId, controlId, threatId);

    const newMitigation = new Mitigation(threatId, controlId, req.user.sub);

    const createRes = await dal.mitigationService.create(newMitigation);

    if (createRes) {
      return res.json({
        mitigation: {
          threatId: createRes.threatId,
          controlId: createRes.controlId,
        },
      });
    } else {
      return res.sendStatus(422);
    }
  };
}

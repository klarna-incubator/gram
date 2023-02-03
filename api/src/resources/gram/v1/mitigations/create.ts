/**
 * POST /api/v1/models/{modelId}/mitigation
 * @exports {function} handler
 */
import { Permission } from "@gram/core/dist/auth/authorization";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import Mitigation from "@gram/core/dist/data/mitigations/Mitigation";
import { validateUUID } from "@gram/core/dist/util/uuid";
import { Request, Response } from "express";
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

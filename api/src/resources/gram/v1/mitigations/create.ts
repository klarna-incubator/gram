/**
 * POST /api/v1/models/{modelId}/mitigation
 * @exports {function} handler
 */
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Mitigation from "@gram/core/dist/data/mitigations/Mitigation.js";
import { validateUUID } from "@gram/core/dist/util/uuid.js";
import { Request, Response } from "express";
import { ensureControlAndThreatPermission } from "./util.js";

export function create(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { threatId, controlId } = req.body;
    const { modelId } = req.params;

    if (
      !validateUUID(modelId) ||
      !validateUUID(threatId) ||
      !validateUUID(controlId)
    ) {
      res
        .json({
          message: "modelId, threatId and controlId must be valid UUIDs",
        })
        .sendStatus(400);
      return;
    }

    // Check authz
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    await ensureControlAndThreatPermission(dal, modelId, controlId, threatId);

    const newMitigation = new Mitigation(threatId, controlId, req.user.sub);

    const createRes = await dal.mitigationService.create(newMitigation);

    if (createRes) {
      res.json({
        mitigation: {
          threatId: createRes.threatId,
          controlId: createRes.controlId,
        },
      });
      return;
    }

    res.sendStatus(422);
  };
}

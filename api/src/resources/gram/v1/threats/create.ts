/**
 * POST /api/v1/models
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Mitigation from "@gram/core/dist/data/mitigations/Mitigation.js";
import Threat from "@gram/core/dist/data/threats/Threat.js";
import { validateUUID } from "@gram/core/dist/util/uuid.js";

export function create(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { title, description, componentId, controlIds } = req.body;
    const { modelId } = req.params;
    console.log(modelId);

    if (title === "" || modelId === "" || componentId === "") {
      res.sendStatus(400);
      return;
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);

    const record = new Threat(
      title,
      description,
      modelId,
      componentId,
      req.user.sub
    );

    const id = await dal.threatService.create(record);
    if (controlIds) {
      await Promise.all(
        controlIds.map(async (controlId: any) => {
          if (validateUUID(controlId)) {
            const newMitigation = new Mitigation(id, controlId, req.user.sub);
            dal.mitigationService.create(newMitigation);
          }
        })
      );
    }

    res.json({ threat: { id } });
    return;
  };
}

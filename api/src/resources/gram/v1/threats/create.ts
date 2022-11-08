/**
 * POST /api/v1/models
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { DataAccessLayer } from "../../../../data/dal";
import Mitigation from "../../../../data/mitigations/Mitigation";
import Threat from "../../../../data/threats/Threat";
import { validateUUID } from "../../../../util/uuid";

export function create(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { title, description, componentId, controlIds } = req.body;
    const { modelId } = req.params;

    if (title === "" || modelId === "" || componentId === "") {
      return res.sendStatus(400);
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

    return res.json({ threat: { id } });
  };
}

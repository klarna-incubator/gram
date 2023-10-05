/**
 * POST /api/v1/models/{modelId}/components/{componentId}/threats/{threatId}/controls/create
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import Control from "@gram/core/dist/data/controls/Control.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Mitigation from "@gram/core/dist/data/mitigations/Mitigation.js";
import { validateUUID } from "@gram/core/dist/util/uuid.js";

export function create(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { title, description, componentId, threatIds } = req.body;
    const { modelId } = req.params;
    const inPlace = req.body.inPlace ? req.body.inPlace : false;

    if (title === "" || modelId === "" || componentId === "") {
      return res.sendStatus(400);
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);

    const newControl = new Control(
      title,
      description,
      inPlace,
      modelId,
      componentId,
      req.user.sub
    );

    const id = await dal.controlService.create(newControl);
    if (threatIds) {
      await Promise.all(
        threatIds.map(async (threatId: any) => {
          if (validateUUID(threatId)) {
            const newMitigation = new Mitigation(threatId, id, req.user.sub);
            dal.mitigationService.create(newMitigation);
          }
        })
      );
    }

    return res.json({ control: { id } });
  };
}

import { Request, Response } from "express";
import { validateUUID } from "@gram/core/dist/util/uuid.js";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export function listResourceMatching(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;
    if (!validateUUID(modelId)) {
      res
        .json({
          message: "modelId must be a valid UUID",
        })
        .sendStatus(400);
      return;
    }

    // Check authz
    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);

    const result = await dal.resourceMatchingService.list(modelId);
    res.json(result);
  };
}

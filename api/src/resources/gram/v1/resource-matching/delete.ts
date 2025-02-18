import { Request, Response } from "express";
import { validateUUID } from "@gram/core/dist/util/uuid.js";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ensureModelAndMatchingPermission } from "./utils.js";
import { NotFoundError } from "@gram/core/dist/util/errors.js";

export function deleteResourceMatching(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { resourceId, componentId } = req.body;
    const { modelId } = req.params;
    const { user } = req;

    console.log("deleteResourceMatching", modelId, resourceId, componentId);

    if (!validateUUID(modelId) || !validateUUID(resourceId)) {
      throw new NotFoundError();
    }

    if (componentId !== null && !validateUUID(componentId)) {
      throw new NotFoundError();
    }

    // Check authz
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);

    // Check that modelId exists and is not approved.
    await ensureModelAndMatchingPermission(dal, modelId);

    const result = await dal.resourceMatchingService.delete(
      modelId,
      resourceId,
      componentId,
      user.sub
    );

    res.json(result);
  };
}

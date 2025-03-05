import { Request, Response } from "express";
import { validateUUID } from "@gram/core/dist/util/uuid.js";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import ResourceMatching from "@gram/core/dist/data/matchings/ResourceMatching.js";
import { ensureModelAndMatchingPermission } from "./utils.js";
import { InvalidInputError } from "@gram/core/dist/util/errors.js";

export function createResourceMatching(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const modelId = req.params?.modelId;
    const resourceId = req.body?.resourceId;
    const componentId = req.body?.componentId;
    const user = req.user;

    if (!validateUUID(modelId)) {
      throw new InvalidInputError("Invalid modelId");
    }

    if (componentId !== null && !validateUUID(componentId)) {
      throw new InvalidInputError("Invalid componentId and /or resourceId");
    }

    if (!resourceId) {
      throw new InvalidInputError("Invalid componentId and /or resourceId");
    }

    // Check authz
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);

    // Check that modelId exists and is not approved.
    await ensureModelAndMatchingPermission(dal, modelId);

    // Get user who created the matching from request

    const matching = new ResourceMatching(
      modelId,
      resourceId,
      componentId,
      user.sub
    );

    const result = await dal.resourceMatchingService.create(matching);
    res.json(result);
  };
}

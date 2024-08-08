import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export function getFlows(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId, dataFlowId } = req.params;

    // Check if user has access to this object
    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);

    res.json({
      flows: await dal.flowService.listFlows(modelId, dataFlowId),
    });
  };
}

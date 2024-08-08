import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export function deleteFlow(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { flowId } = req.params;

    if (!flowId) {
      res.status(400).json({ message: "Missing id" });
      return;
    }

    const id = parseInt(flowId);
    const flow = await dal.flowService.getById(id);

    console.log(flow);

    if (!flow) {
      res.status(404).json({ message: "Flow not found" });
      return;
    }

    // Check if user has access to this object
    await req.authz.hasPermissionsForModelId(flow.modelId, Permission.Write);

    await dal.flowService.deleteFlow(id);

    res.status(204).json();
  };
}

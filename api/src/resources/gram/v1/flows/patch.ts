import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";
import { PatchFlowSchema } from "./FlowSchema.js";

export function patchFlow(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { flowId, attributes, originComponentId, summary } =
      PatchFlowSchema().parse({
        ...req.body,
        flowId: parseInt(req.params.flowId),
      });

    const flow = await dal.flowService.getById(flowId);

    if (!flow) {
      res.status(404).json({ message: "Flow not found" });
      return;
    }

    // Check if user has access to this object
    await req.authz.hasPermissionsForModelId(flow.modelId, Permission.Write);

    await dal.flowService.patchFlow(
      flowId,
      summary,
      originComponentId,
      attributes
    );

    res.status(200).send();
  };
}

import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";
import { NewFlowSchema } from "./FlowSchema.js";

export function insertFlow(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId, dataFlowId, summary, originComponentId, attributes } =
      NewFlowSchema().parse({
        ...req.body,
        modelId: req.params.modelId,
        dataFlowId: req.params.dataFlowId,
      });

    // Check if user has access to this object
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);

    const newFlow = await dal.flowService.insertFlow(
      modelId,
      dataFlowId,
      summary,
      originComponentId,
      attributes,
      req.authz.user.sub
    );

    res.json({
      flow: newFlow,
    });
  };
}

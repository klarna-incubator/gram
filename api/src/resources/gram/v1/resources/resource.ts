import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export function getResources(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const modelId = req.params.id;
    const model = await dal.modelService.getById(modelId);
    if (model && model.systemId) {
      const resources = await dal.resourceHandler.getResources(model.systemId);
      return res.json(resources);
    }
  };
}

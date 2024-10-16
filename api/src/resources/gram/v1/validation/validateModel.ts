/**
 * GET /api/v1/validate/{id}
 * @exports {function} handler
 */
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { Request, Response } from "express";

export function validateModel(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const modelId = req.params.id;
    let model: Model | null = null;
    model = await dal.modelService.getById(modelId);

    if (model) {
      const validationResults = await dal.validationHandler.validate(model);
      return res.json({
        id: modelId,
        total: validationResults.length,
        results: validationResults,
      });
    }
  };
}

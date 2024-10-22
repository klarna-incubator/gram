/**
 * GET /api/v1/validate/{id}
 * @exports {function} handler
 */
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export function validateModel(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const modelId = req.params.id;
    if (dal.validationEngine.rules.length === 0) {
      return res.json({
        id: modelId,
        total: 0,
        results: [],
        message: "No validation rules registered",
      });
    }

    const validationResults = await dal.validationEngine.getResults(modelId);

    if (validationResults.length === 0) {
      return res.json({
        id: modelId,
        total: 0,
        results: [],
        message: `No rule applies to model ${modelId}`,
      });
    }

    return res.json({
      id: modelId,
      total: validationResults.length,
      results: validationResults,
    });
  };
}

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
    // Get the model from the DAL
    try {
      model = await dal.modelService.getById(modelId);

      if (!model) {
        return res.sendStatus(400);
      }
    } catch (error) {
      return res.sendStatus(400);
    }
    // Validate the model
    try {
      // Use validation service to validate the model
      // Return the validation results + model id
      console.log(
        "dal.validationHandler.validationProviders",
        dal.validationHandler.validationProviders
      );

      const validationResults = await dal.validationHandler.validate(model);

      return res.json({
        id: modelId,
        total: validationResults.length,
        results: validationResults,
      });
    } catch (error) {
      return res.sendStatus(400);
    }
  };
}

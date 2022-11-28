/**
 * GET /api/v1/models/<id>/set-template
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Role } from "../../../../auth/models/Role";
import { ModelDataService } from "../../../../data/models/ModelDataService";

export default (dataModels: ModelDataService) => {
  return async (req: Request, res: Response) => {
    req.authz.is(Role.Admin);

    const modelId = req.params.id;
    const { isTemplate } = req.body;

    if (!modelId || typeof isTemplate !== "boolean") {
      return res.status(400).json({ error: "bad input" });
    }

    const result = await dataModels.setTemplate(modelId, isTemplate);
    return res.json({ result });
  };
};

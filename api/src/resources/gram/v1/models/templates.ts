/**
 * GET /api/v1/models/templates
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService";

export default (dataModels: ModelDataService) => {
  return async (req: Request, res: Response) => {
    const templates = await dataModels.getTemplates();
    return res.json({ templates });
  };
};

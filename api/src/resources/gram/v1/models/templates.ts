/**
 * GET /api/v1/models/templates
 * @exports {function} handler
 */

import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export default (dal: DataAccessLayer) => {
  return async (req: Request, res: Response) => {
    const templates = await dal.modelService.getTemplates();
    return res.json({ templates });
  };
};

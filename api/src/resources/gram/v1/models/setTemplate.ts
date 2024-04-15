/**
 * GET /api/v1/models/<id>/set-template
 * @exports {function} handler
 */

import { Role } from "@gram/core/dist/auth/models/Role.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";
import { z } from "zod";

const SetTemplateSchema = z.object({
  isTemplate: z.boolean(),
});

export default (dal: DataAccessLayer) => {
  return async (req: Request, res: Response) => {
    req.authz.is(Role.Admin);

    const modelId = req.params.id;
    const { isTemplate } = SetTemplateSchema.parse(req.body);

    const result = await dal.modelService.setTemplate(modelId, isTemplate);
    return res.json({ result });
  };
};

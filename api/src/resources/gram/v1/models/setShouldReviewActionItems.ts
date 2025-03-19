/**
 * GET /api/v1/models/<id>/set-should-review-action-items
 * @exports {function} handler
 */

import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";
import { z } from "zod";

const Schema = z.object({
  shouldReviewActionItems: z.boolean(),
});

export default (dal: DataAccessLayer) => {
  return async (req: Request, res: Response) => {
    const modelId = req.params.id;

    await req.authz.hasAnyPermissionsForModelId(modelId, Permission.Write);

    const { shouldReviewActionItems } = Schema.parse(req.body);

    const result = await dal.modelService.setShouldReviewActionItems(
      modelId,
      shouldReviewActionItems
    );
    res.json({ result });
    return;
  };
};

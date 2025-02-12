/**
 * PATCH /api/v1/reviews/{id}
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { modelId } = req.params;
    const { newReviewer } = req.body;
    const ctx = { currentRequest: req };

    if (
      !newReviewer ||
      ((await dal.reviewerHandler.getFallbackReviewer(ctx))?.sub !==
        newReviewer &&
        (await dal.reviewerHandler.lookup(ctx, [newReviewer])).length === 0)
    ) {
      res.sendStatus(400);
      return;
    }

    /**
     * Both System Owners and Reviewers should be able to change reviewer.
     */
    await req.authz.hasAnyPermissionsForModelId(
      modelId,
      Permission.Review,
      Permission.Write
    );
    const result = await dal.reviewService.changeReviewer(modelId, newReviewer);
    res.json({ result });
    return;
  };

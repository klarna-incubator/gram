/**
 * GET /api/v1/reviews/reviewers
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { modelId } = req.query;
    const ctx = { currentRequest: req };

    if (!modelId) {
      const reviewers = await dal.reviewerHandler.getReviewers(ctx);
      res.json({ reviewers });
      return;
    }

    const model = await dal.modelService.getById(modelId as string);

    if (!model) {
      res.status(404);
      return;
    }

    const reviewers = await dal.reviewerHandler.getReviewersForModel(
      ctx,
      model
    );

    res.json({ reviewers });
  };

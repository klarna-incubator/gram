/**
 * GET /api/v1/reviews/reviewers
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { DataAccessLayer } from "../../../../data/dal";
import { reviewerProvider } from "../../../../data/reviews/ReviewerProvider";

export default (dal: DataAccessLayer) => async (req: Request, res: Response) => {
  const { modelId } = req.query;
  const ctx = { currentRequest: req };

  if (!modelId) {
    const reviewers = await reviewerProvider.getReviewers(ctx);
    return res.json({ reviewers });
  } else {
    const model = await dal.modelService.getById(modelId as string);

    if (!model) {
      return res.status(404);
    }

    const reviewers = await reviewerProvider.getReviewersForModel(ctx, model);

    return res.json({ reviewers });
  }
};

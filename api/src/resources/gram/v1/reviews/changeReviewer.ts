/**
 * PATCH /api/v1/reviews/{id}
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { reviewerProvider } from "@gram/core/dist/data/reviews/ReviewerProvider";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { modelId } = req.params;
    const { newReviewer } = req.body;

    if (
      !newReviewer ||
      (await reviewerProvider.lookup({ currentRequest: req }, [newReviewer]))
        .length === 0
    ) {
      return res.sendStatus(400);
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
    return res.json({ result });
  };

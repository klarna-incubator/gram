/**
 * POST /api/v1/reviews
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { modelId } = req.params;
    const { reviewedBy } = req.body;
    const requestedBy = req.user.sub;

    if (!modelId || !requestedBy || !reviewedBy) return res.sendStatus(400);

    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);

    const review = new Review(
      modelId,
      requestedBy,
      ReviewStatus.Requested,
      reviewedBy
    );
    const id = await dal.reviewService.create(review);
    if (!id) {
      return res.status(500);
    }
    return res.json({ review });
  };

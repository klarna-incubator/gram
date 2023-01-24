import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { DataAccessLayer } from "../../../../data/dal";
import { lookupUser } from "../../../../auth/user";
import { validateUUID } from "../../../../util/uuid";
import { lookupReviewer } from "../../../../data/reviews/ReviewerProvider";

/**
 * GET /api/v1/reviews/{modelId}
 * @exports {function} handler
 */
export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { modelId } = req.params;
    if (!modelId) {
      return res.sendStatus(400);
    }

    if (!validateUUID(modelId)) {
      return res.sendStatus(400);
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);
    const review = await dal.reviewService.getByModelId(modelId);

    if (!review) {
      return res.sendStatus(404);
    }
    const requester = await lookupUser(
      { currentRequest: req },
      review.requestedBy
    );
    const reviewer = await lookupReviewer(
      { currentRequest: req },
      review.reviewedBy
    );

    return res.json({
      review: {
        model_id: review.modelId,
        status: review.status,
        note: review.note,
        created_at: review.createdAt,
        updated_at: review.updatedAt,
        approved_at: review.approvedAt,
        requester,
        reviewer,
      },
    });
  };

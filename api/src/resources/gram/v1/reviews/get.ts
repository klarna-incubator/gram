import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { validateUUID } from "@gram/core/dist/util/uuid.js";

/**
 * GET /api/v1/reviews/{modelId}
 * @exports {function} handler
 */
export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { modelId } = req.params;
    if (!modelId) {
      res.sendStatus(400);
      return;
    }

    if (!validateUUID(modelId)) {
      res.sendStatus(400);
      return;
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);
    const review = await dal.reviewService.getByModelId(modelId);

    if (!review) {
      res.sendStatus(404);
      return;
    }
    const requester = await dal.userHandler.lookupUser(
      { currentRequest: req },
      review.requestedBy
    );
    const reviewer = await dal.reviewerHandler.lookupReviewer(
      { currentRequest: req },
      review.reviewedBy
    );

    res.json({
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

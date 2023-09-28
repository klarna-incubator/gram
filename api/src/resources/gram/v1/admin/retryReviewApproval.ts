import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

/**
 * Specific admin route to retrigger the approved event on reviews.
 * Should be part of Klarna specific plugin, will move it at some later point.
 * @param dal
 * @returns
 */
export function retryReviewApproval(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const modelId = req.body.modelId;
    const review = await dal.reviewService.getByModelId(modelId);
    if (!review) {
      res.status(404).json({ message: "No review found for id " + modelId });
      return;
    }
    // Spoofing the approved event should retrigger the ticket creation.
    dal.reviewService.emit("approved", { review });
    res.json({ message: "Review approval retriggered for " + modelId });
  };
}

import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Review } from "@gram/core/dist/data/reviews/Review.js";
import { linkToModel } from "@gram/core/dist/util/links.js";

export async function generalReviewNotificationVariables(
  dal: DataAccessLayer,
  review: Review
) {
  const model = await dal.modelService.getById(review.modelId);
  if (model === null) {
    throw new Error(
      `Review object has invalid model id: ${review.modelId}. This should not be possible as all reviews are bound to a model. Help?`
    );
  }

  const [reviewer, requester, fallbackReviewer] = await Promise.all([
    // Lookup Reviewer
    (async () => {
      // Handle the special case where Secure Development team is assigned
      const reviewer = await dal.reviewerHandler.lookupReviewer(
        {},
        review.reviewedBy
      );
      return {
        email: reviewer?.mail,
        name: reviewer?.name,
      };
    })(),
    // Lookup Requester
    (async () => {
      const requester = await dal.userHandler.lookupUser(
        {},
        review.requestedBy
      );
      return {
        email: requester?.mail,
        name: requester?.name,
      };
    })(),
    dal.reviewerHandler.getFallbackReviewer({}),
  ]);

  const modelInfo = {
    link: linkToModel(review.modelId),
    name: `${model.version}`,
  };

  return {
    reviewer,
    fallbackReviewer,
    requester,
    model: modelInfo,
    review: {
      note: review.note,
      approvedAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      meetingRequestedAt: review.meetingRequestedAt
        ? review.meetingRequestedAt.toLocaleDateString()
        : null,
    },
  };
}

import { lookupUser } from "../../../auth/user";
import { DataAccessLayer } from "../../../data/dal";
import { Review } from "../../../data/reviews/Review";
import { lookupReviewer } from "../../../data/reviews/ReviewerProvider";
import { linkToModel } from "../../../util/links";

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

  const [reviewer, requester] = await Promise.all([
    // Lookup Reviewer
    (async () => {
      // Handle the special case where Secure Development team is assigned
      const reviewer = await lookupReviewer(review.reviewedBy);
      return {
        email: reviewer?.mail,
        name: reviewer?.name,
      };
    })(),
    // Lookup Requester
    (async () => {
      const requester = await lookupUser(review.requestedBy);
      return {
        email: requester?.mail,
        name: requester?.name,
      };
    })(),
  ]);

  const modelInfo = {
    link: linkToModel(review.modelId),
    name: `${model.version}`,
  };

  return {
    reviewer,
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

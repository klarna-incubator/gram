import { lookupUser } from "gram-api/src/auth/user";
import { DataAccessLayer } from "gram-api/src/data/dal";
import { Review } from "gram-api/src/data/reviews/Review";
import { lookupReviewer } from "gram-api/src/data/reviews/ReviewerProvider";
import { linkToModel } from "gram-api/src/util/links";

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
      const reviewer = await lookupReviewer({}, review.reviewedBy);
      return {
        email: reviewer?.mail,
        name: reviewer?.name,
      };
    })(),
    // Lookup Requester
    (async () => {
      const requester = await lookupUser({}, review.requestedBy);
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

import { AuthzError } from "@gram/core/dist/auth/AuthzError.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { NotFoundError } from "@gram/core/dist/util/errors.js";

export async function ensureModelAndMatchingPermission(
  dal: DataAccessLayer,
  modelId: string
) {
  const model = await dal.modelService.getById(modelId);

  // Ensure model exists
  if (!model) {
    throw new NotFoundError();
  }

  // Ensure model is not approved
  if (model?.reviewStatus === ReviewStatus.Approved) {
    throw new AuthzError(
      `model ${modelId} is already approved and cannot be modified`
    );
  }
}

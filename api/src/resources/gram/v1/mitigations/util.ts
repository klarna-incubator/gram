import { AuthzError } from "@gram/core/dist/auth/AuthzError.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { NotFoundError } from "@gram/core/dist/util/errors.js";

export async function ensureControlAndThreatPermission(
  dal: DataAccessLayer,
  modelId: string,
  controlId: string,
  threatId: string
) {
  const [control, threat] = await Promise.all([
    dal.controlService.getById(controlId),
    dal.threatService.getById(threatId),
  ]);

  // Slightly confusing, this function is used to check that object-level permissions are correct.
  // If either control or threat is deleted, then it's actually a 404 that should
  // be returned to the user. However, since we don't check that before authz...
  if (!control && !threat) {
    throw new NotFoundError();
  }

  if (control?.modelId != modelId || threat?.modelId != modelId) {
    throw new AuthzError(
      `control or threat modelId ${control?.modelId} ${threat?.modelId}
      } does not match given modelId ${modelId}`
    );
  }
}

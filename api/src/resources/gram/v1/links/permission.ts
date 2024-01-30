import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { LinkObjectId } from "@gram/core/dist/data/links/Link.js";
import { InvalidInputError } from "@gram/core/dist/util/errors.js";

export async function checkLinkPermission(
  dal: DataAccessLayer,
  req: Express.Request,
  objectType: string,
  objectId: LinkObjectId,
  ...permissions: Permission[]
) {
  let modelId: string = "";

  if (objectType === "model") {
    modelId = objectId;
  } else if (objectType === "threat") {
    const threat = await dal.threatService.getById(objectId);
    if (!threat) {
      throw new InvalidInputError("Invalid ThreatId");
    }
    modelId = threat.modelId;
  } else if (objectType === "control") {
    const control = await dal.controlService.getById(objectId);
    if (!control) {
      throw new InvalidInputError("Invalid ControlId");
    }
    modelId = control.modelId;
  }

  if (objectType === "system") {
    await req.authz.hasPermissionsForSystemId(objectId, ...permissions);
  } else {
    await req.authz.hasPermissionsForModelId(modelId, ...permissions);
  }
}

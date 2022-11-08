/**
 * GET /api/v1/models/{id}
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { SystemPropertyHandler } from "../../../../data/system-property";
import { ModelDataService } from "../../../../data/models/ModelDataService";

export function getProperties(
  sysPropHandler: SystemPropertyHandler,
  dataModels: ModelDataService
) {
  return async (req: Request, res: Response) => {
    const id = req.params.id;

    const model = await dataModels.getById(id);

    if (model === null) {
      return res.sendStatus(404);
    }

    await req.authz.hasPermissionsForModel(model, Permission.Read);

    const properties = await sysPropHandler.contextualize(model.systemId);

    return res.json({ properties });
  };
}

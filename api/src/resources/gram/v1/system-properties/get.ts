/**
 * GET /api/v1/models/{id}
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization";
import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService";
import { SystemPropertyHandler } from "@gram/core/dist/data/system-property/SystemPropertyHandler";

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

    if (model.systemId === null) {
      return res.json({ properties: [] });
    }

    const properties = await sysPropHandler.contextualize(
      { currentRequest: req },
      model.systemId
    );

    return res.json({ properties });
  };
}

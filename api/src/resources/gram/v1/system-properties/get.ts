/**
 * GET /api/v1/models/{id}
 * @exports {function} handler
 */
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export function getProperties(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const id = req.params.id;

    const model = await dal.modelService.getById(id);

    if (model === null) {
      res.sendStatus(404);
      return;
    }

    await req.authz.hasPermissionsForModel(model, Permission.Read);

    if (model.systemId === null) {
      res.json({ properties: [] });
      return;
    }

    const properties = await dal.sysPropHandler.contextualize(
      { currentRequest: req },
      model.systemId
    );

    res.json({ properties });
    return;
  };
}

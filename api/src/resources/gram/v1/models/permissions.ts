/**
 * GET /api/v1/models/<id>/permissions
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { ModelDataService } from "../../../../data/models/ModelDataService";

export default (dataModels: ModelDataService) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const model = await dataModels.getById(id);
    if (model === null) {
      return res.sendStatus(404);
    }

    const permissions = await req.authz.getPermissionsForModel(model);
    return res.json({ permissions });
  };

/**
 * GET /api/v1/models/<id>/permissions
 * @exports {function} handler
 */

import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const model = await dal.modelService.getById(id);
    if (model === null) {
      return res.sendStatus(404);
    }

    const permissions = await req.authz.getPermissionsForModel(model);
    return res.json({ permissions });
  };

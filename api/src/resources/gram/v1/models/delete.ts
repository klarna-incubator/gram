/**
 * POST /api/v1/models
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { ModelDataService } from "../../../../data/models/ModelDataService";

export default (dataModels: ModelDataService) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    await req.authz.hasPermissionsForModelId(id, Permission.Delete);
    const result = await dataModels.delete(id);
    return res.json({ deleted: result });
  };

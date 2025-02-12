/**
 * POST /api/v1/models
 * @exports {function} handler
 */

import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    await req.authz.hasPermissionsForModelId(id, Permission.Delete);
    const result = await dal.modelService.delete(id);
    res.json({ deleted: result });
    return;
  };

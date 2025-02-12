import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService.js";
import { validateUUID } from "@gram/core/dist/util/uuid.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

/**
 * GET /api/v1/models/{id}
 * @exports {function} handler
 */
export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!validateUUID(id)) {
      res.sendStatus(400);
      return;
    }

    const model = await dal.modelService.getById(id);

    if (model === null) {
      res.sendStatus(404);
      return;
    }

    await req.authz?.hasPermissionsForModel(model, Permission.Read);
    await dal.modelService.logAction(req.user.sub, id, "get");

    if (!model.data.components) {
      model.data.components = [];
    }

    if (!model.data.dataFlows) {
      model.data.dataFlows = [];
    }

    res.json({ model });
    return;
  };

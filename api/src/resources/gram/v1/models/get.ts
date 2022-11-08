import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { ModelDataService } from "../../../../data/models/ModelDataService";
import { validateUUID } from "../../../../util/uuid";

/**
 * GET /api/v1/models/{id}
 * @exports {function} handler
 */
export default (dataModels: ModelDataService) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!validateUUID(id)) {
      return res.sendStatus(400);
    }

    const model = await dataModels.getById(id);

    if (model === null) {
      return res.sendStatus(404);
    }

    await req.authz?.hasPermissionsForModel(model, Permission.Read);
    await dataModels.logAction(req.user.sub, id, "get");

    if (!model.data.components) {
      model.data.components = [];
    }

    if (!model.data.dataFlows) {
      model.data.dataFlows = [];
    }

    return res.json({ model });
  };

/**
 * POST /api/v1/models
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import Model from "../../../../data/models/Model";
import { ModelDataService } from "../../../../data/models/ModelDataService";
import { getLogger } from "../../../../logger";

const log = getLogger("models.create");

export default (dataModels: ModelDataService) =>
  async (req: Request, res: Response) => {
    const version = req.body.version;
    const systemId = req.body.systemId;
    const sourceModelId = req.body.sourceModelId;

    if (!version || version === "") return res.sendStatus(400);

    const finalSystemId = systemId
      ? systemId
      : "00000000-0000-0000-0000-000000000000";

    const model = new Model(finalSystemId, version, req.user.sub);
    await req.authz?.hasPermissionsForModel(model, Permission.Write);

    let id = null;
    if (sourceModelId) {
      const srcModel = await dataModels.getById(sourceModelId);
      if (srcModel === null) {
        return res.sendStatus(400);
      }
      await req.authz?.hasPermissionsForModel(srcModel, Permission.Read);

      id = await dataModels.copy(srcModel.id!, model);
    } else {
      // Normal creation without any kind of import
      id = await dataModels.create(model);
    }
    await dataModels.logAction(req.user.sub, id, "create");
    return res.json({ model: { id } });
  };

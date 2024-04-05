/**
 * POST /api/v1/models
 * @exports {function} handler
 */
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { Request, Response } from "express";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const version = req.body.version;
    const systemId = req.body.systemId;
    const sourceModelId = req.body.sourceModelId;

    if (!version || version === "") return res.sendStatus(400);

    const model = new Model(systemId, version, req.user.sub);
    await req.authz?.hasPermissionsForModel(model, Permission.Write);

    let id: string | null = null;
    if (sourceModelId) {
      const srcModel = await dal.modelService.getById(sourceModelId);
      if (srcModel === null) {
        return res.sendStatus(400);
      }
      await req.authz?.hasPermissionsForModel(srcModel, Permission.Read);

      id = await dal.modelService.copy(srcModel.id!, model);
    } else {
      // Normal creation without any kind of import
      id = await dal.modelService.create(model);
    }
    if (id === null) throw new Error("Copy of model failed");
    await dal.modelService.logAction(req.user.sub, id, "create");
    return res.json({ model: { id } });
  };

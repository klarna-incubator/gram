import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { validateUUID } from "@gram/core/dist/util/uuid.js";
import { Request, Response } from "express";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const modelId = req.params.id;
    if (!validateUUID(modelId)) {
      res.sendStatus(400);
      return;
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);
    const payload = await dal.modelTransferService.exportModel(
      modelId,
      req.user.sub
    );
    await dal.modelService.logAction(req.user.sub, modelId, "export-json");

    res.json({
      payload,
    });
  };

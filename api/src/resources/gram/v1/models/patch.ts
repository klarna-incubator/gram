import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { ModelDataService } from "../../../../data/models/ModelDataService";

/**
 * PATCH /api/v1/models/{id}
 * @exports {function} handler
 */
export default (dataModels: ModelDataService) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const { version, data } = req.body;

    await req.authz.hasPermissionsForModelId(id, Permission.Write);

    const result = await dataModels.update(id, { version, data });

    if (!result) {
      return res.sendStatus(500);
    }

    await dataModels.logAction(req.user.sub, id, "patch");

    return res.json({ id, version, data });
  };

import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

/**
 * PATCH /api/v1/models/{id}
 * @exports {function} handler
 */
export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const { version, data } = req.body;

    await req.authz.hasPermissionsForModelId(id, Permission.Write);

    const result = await dal.modelService.update(id, {
      version,
      data,
    });

    if (!result) {
      res.sendStatus(500);
      return;
    }

    await dal.modelService.logAction(req.user.sub, id, "patch"); // consider removing this as it triggers every time the diagram is changed

    res.json({ id, version, data });
    return;
  };

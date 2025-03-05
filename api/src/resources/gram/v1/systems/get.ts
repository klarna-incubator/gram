/**
 * GET /api/v1/systems/{id}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    await req.authz.hasPermissionsForSystemId(id, Permission.Read);
    const system = await dal.systemProvider.getSystem(
      { currentRequest: req },
      id.toString()
    );

    if (system === null) {
      res.sendStatus(404);
      return;
    }

    res.json({ system });
    return;
  };

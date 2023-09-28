/**
 * GET /api/v1/systems/{id}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { systemProvider } from "@gram/core/dist/data/systems/systems.js";

export default async (req: Request, res: Response) => {
  const id = req.params.id;
  await req.authz.hasPermissionsForSystemId(id, Permission.Read);
  const system = await systemProvider.getSystem(
    { currentRequest: req },
    id.toString()
  );

  if (system === null) {
    return res.sendStatus(404);
  }

  return res.json({ system });
};

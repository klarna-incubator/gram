/**
 * GET /api/v1/systems/{id}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { systemProvider } from "../../../../data/systems/SystemProvider";

export default async (req: Request, res: Response) => {
  const id = req.params.id;
  await req.authz.hasPermissionsForSystemId(id, Permission.Read);
  const system = await systemProvider.getSystem({ currentRequest: req }, id.toString());

  if (system === null) {
    return res.sendStatus(404);
  }

  return res.json({ system });
};

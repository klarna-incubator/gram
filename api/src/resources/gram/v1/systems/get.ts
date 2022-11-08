/**
 * GET /api/v1/systems/{id}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { getById } from "../../../../data/systems";

export default async (req: Request, res: Response) => {
  const id = req.params.id;
  await req.authz.hasPermissionsForSystemId(id, Permission.Read);
  const system = await getById(id);

  if (system === null) {
    return res.sendStatus(404);
  }

  return res.json({ system });
};

/**
 * Removes a target role from the user's token. Useful for debugging authorization.
 * Only allows removing authorization, not adding. For security :)
 *
 *
 * Examples:
 * GET /api/v1/admin/drop_role?role=admin
 * GET /api/v1/admin/drop_role?role=admin,reviewer
 *
 * Useful to drop any special role:
 * http://localhost:8080/api/v1/admin/drop_role?role=reviewer,admin
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Role } from "@gram/core/dist/auth/models/Role";
import * as jwt from "@gram/core/dist/auth/jwt";
import { getLogger } from "@gram/core/dist/logger";
import { UserToken } from "@gram/core/dist/auth/models/UserToken";

const log = getLogger("dropRole");

export default async function setRoles(req: Request, res: Response) {
  const { roles } = req.body;
  const user = req.user;

  log.warn(
    `Set role called by user ${user.sub}, requesting to set roles to ${roles}`
  );

  try {
    if (Array.isArray(roles)) {
      const payload: UserToken = {
        roles,
        sub: user.sub,
        teams: user.teams,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        slackId: user.slackId,
      };
      const token = await jwt.generateToken(payload);
      res.json({ token, new_roles: roles });
    } else {
      res.sendStatus(400);
      res.json({ new_roles: user.roles });
    }
  } catch (error: any) {
    if (error.message === "missing") return res.sendStatus(400);
    if (error.message === "forbidden") return res.sendStatus(403);
    throw error;
  }
}

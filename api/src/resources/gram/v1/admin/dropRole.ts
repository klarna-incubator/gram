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

export default async function dropRole(req: Request, res: Response) {
  const { role } = req.query;
  const user = req.user;

  log.warn(`Role drop called by user ${user.sub}, requesting to drop ${role}`);

  try {
    if (role) {
      user.roles = user.roles.filter(
        (r: Role) => !(role as string[]).includes(r)
      );
      const payload: UserToken = {
        roles: user.roles,
        sub: user.sub,
        teams: user.teams,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        slackId: user.slackId,
      };
      const token = await jwt.generateToken(payload);
      res.json({ token, new_roles: user.roles });
    } else {
      res.json({ new_roles: user.roles });
    }
  } catch (error: any) {
    if (error.message === "missing") return res.sendStatus(400);
    if (error.message === "forbidden") return res.sendStatus(403);
    throw error;
  }
}

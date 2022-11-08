/**
 * Removes a target role from the user's token. Useful for debugging authorization.
 * Only allows removing authorization, not adding. For security :)
 *
 * CSRF DoS risk here is acceptable, imo.
 *
 * Examples:
 * GET /api/v1/admin/drop_role?role=admin
 * GET /api/v1/admin/drop_role?role=admin,reviewer
 *
 * Useful to drop any special role:
 * http://localhost:8080/api/v1/admin/drop_role?role=reviewer,admin
 * @exports {function} handler
 */

import config from "config";
import { Request, Response } from "express";
import { Role } from "../../../../auth/models/Role";
import * as jwt from "../../../../auth/jwt";
import { getLogger } from "../../../../logger";
import { UserToken } from "../../../../auth/models/UserToken";

const cookieOpts: any = config.get("cookie");
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
      res.cookie("bearerToken", token, cookieOpts);
    }
    res.json({ new_roles: user.roles });
  } catch (error: any) {
    if (error.message === "missing") return res.sendStatus(400);
    if (error.message === "forbidden") return res.sendStatus(403);
    throw error;
  }
}

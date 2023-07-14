/**
 * Auth middleware
 * @exports auth
 */
import * as jwt from "@gram/core/dist/auth/jwt";
import * as Sentry from "@sentry/node";
import { NextFunction, Response } from "express";
import { getLogger } from "log4js";
import { hasSentry } from "../util/sentry";

const log = getLogger("authMw");

export async function validateTokenMiddleware(
  req: any,
  res: Response,
  next: NextFunction
) {
  let token = "";
  const authString = req.headers["authorization"] || "no-auth";
  if (authString.toLowerCase().startsWith("bearer ")) {
    token = authString.replace(/^bearer /i, "");
  }

  if (token) {
    try {
      req.user = await jwt.validateToken(token);

      if (hasSentry()) {
        Sentry.setUser({ email: req.user.sub, roles: req.user.roles });
      }
    } catch (error: any) {
      log.info(`Validating token resulted to: ${error.message}`);
      // TODO: Error on suspicious errors (failed signature)
    }
  }

  return next();
}

export async function authRequiredMiddleware(
  req: any,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.sendStatus(401);
  }
  return next();
}

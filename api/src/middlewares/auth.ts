/**
 * Auth middleware
 * @exports auth
 */
import * as jwt from "@gram/core/dist/auth/jwt.js";
import * as Sentry from "@sentry/node";
import { NextFunction, Response, Request } from "express";
import log4js from "log4js";
import { hasSentry } from "../util/sentry.js";

const log = log4js.getLogger("authMw");

export async function validateTokenMiddleware(
  req: Request,
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
  next();
}

export async function authRequiredMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }
  next();
}

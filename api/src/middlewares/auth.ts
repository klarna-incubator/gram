/**
 * Auth middleware
 * @exports auth
 */
import { NextFunction, Request, Response } from "express";
import * as jwt from "../auth/jwt";
import { getLogger } from "../logger";
import { hasSentry } from "../util/sentry";
import * as Sentry from "@sentry/node";

const log = getLogger("authMw");

export async function validateTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let token = "";
  const authString = req.headers["authorization"] || "no-auth";
  if (authString.toLowerCase().startsWith("bearer ")) {
    token = authString.replace(/^bearer /i, "");
  } else if (req.cookies.bearerToken) {
    token = req.cookies.bearerToken;
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
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.sendStatus(401);
  }
  return next();
}

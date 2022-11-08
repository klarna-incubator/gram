/**
 * CSRF middleware
 * @exports csrf
 */

import { Request, Response } from "express";
import { NextFunction } from "express-serve-static-core";
import { getLogger } from "log4js";
import { validateToken } from "../auth/jwt";

const log = getLogger("csrf");

export async function csrfTokenRequired(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If from a request without a cookie, then the request **should** have come from something
  // different than a browser, i.e. a system client.
  const cookieToken = req.cookies?.csrf;
  if (!cookieToken && !req.cookies?.bearerToken) {
    return next();
  }

  try {
    // Does normal JWT validation, throws on not signed, expiry etc.
    await validateToken(cookieToken, "csrf");
  } catch (error: any) {
    log.warn(`CSRF failed JWT validation: ${error.message}`);
    return res
      .status(401)
      .clearCookie("csrf")
      .json({ message: "failed to validate CSRF cookie" });
  }

  // Validate that csrf cookie matches x-csrf-token
  if (!cookieToken || cookieToken !== req.headers["x-csrf-token"]) {
    log.warn(`Header CSRF token did not match Cookie CSRF token`);
    return res.status(401).json({ message: "failed to validate CSRF header" });
  }

  return next();
}

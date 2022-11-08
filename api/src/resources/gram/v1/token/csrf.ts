/**
 * GET /api/v1/token
 * @exports {function} handler
 */
import { Request, Response } from "express";
import * as jwt from "../../../../auth/jwt";
import config from "config";

const cookieOpts: any = config.get("cookie");

export default async function getCsrfToken(req: Request, res: Response) {
  const ttl = 10 * 60;
  const token = await jwt.generateToken({}, ttl, "csrf");
  // Cookie expiry is longer to avoid potential race conditions, so we only have to care about
  // jwt expiry.
  res.cookie("csrf", token, {
    ...cookieOpts,
    maxAge: 2 * ttl * 1000,
  });
  res.json({ token });
}

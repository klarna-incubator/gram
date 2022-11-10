/**
 * GET /api/v1/token
 * @exports {function} handler
 */
import config from "config";
import { Request, Response } from "express";
import AuthProviderRegistry from "../../../../auth/AuthProviderRegistry";
import * as jwt from "../../../../auth/jwt";

const cookieOpts: any = config.get("cookie");

export default async function getAuthToken(req: Request, res: Response) {
  if (req.query.provider === undefined) return res.sendStatus(400);

  const provider = req.query.provider as string;

  if (process.env.NODE_ENV !== "test" && AuthProviderRegistry.has("mock")) {
    throw new Error("`mock` should not be enabled outside test env");
  }

  const identity = await AuthProviderRegistry.get(provider)?.getIdentity(req);

  if (!identity) {
    return res.sendStatus(400);
  }

  const token = await jwt.generateToken(identity);
  res.cookie("bearerToken", token, cookieOpts);
  res.json({ token });
}

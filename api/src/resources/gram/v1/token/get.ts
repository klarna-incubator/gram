/**
 * GET /api/v1/token
 * @exports {function} handler
 */
import { Request, Response } from "express";
import AuthProviderRegistry from "@gram/core/dist/auth/AuthProviderRegistry";
import * as jwt from "@gram/core/dist/auth/jwt";

export default async function getAuthToken(req: Request, res: Response) {
  if (req.query.provider === undefined) return res.sendStatus(400);

  const provider = req.query.provider as string;

  if (process.env.NODE_ENV !== "test" && AuthProviderRegistry.has("mock")) {
    throw new Error("`mock` should not be enabled outside test env");
  }

  const result = await AuthProviderRegistry.get(provider)?.getIdentity({
    currentRequest: req,
  });

  if (result?.status != "ok") {
    res.sendStatus(400);
    return res.json(result);
  }

  const token = await jwt.generateToken(result.token);
  res.json({ status: "ok", token });
}

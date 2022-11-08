/**
 * GET /api/v1/user
 *
 * Simply returns the claims stored in the JWT. This is primarily for
 * cookie-based clients
 *
 * @exports {function} handler
 */
import { Request, Response } from "express";

export default async (req: Request, res: Response) => {
  res.json({ ...req.user });
};

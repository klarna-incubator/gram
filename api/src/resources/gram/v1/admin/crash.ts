/**
 * Throws an error. Just want this to check if error reporting (e.g. sentry) is working ok.
 *
 * Examples:
 * GET /api/v1/admin/crash
 */

import { Request, Response } from "express";

export default async function crash(req: Request, res: Response) {
  throw new Error(`Crash on purpose triggered by ${req.user.sub}`);
}

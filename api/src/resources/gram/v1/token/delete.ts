/**
 * DELETE /api/v1/token
 *
 * Note: Gram doesn't and shouldn't have token state in any point of the
 * application. This particular endpoint only serves cookie-based clients
 * and instruct them to clear cookies.
 *
 * @exports {function} handler
 */

import { Request, Response } from "express";

export default async function deleteToken(req: Request, res: Response) {
  //TODO: pass through to authProvider in case logic is needed to logout.
  res.end();
}

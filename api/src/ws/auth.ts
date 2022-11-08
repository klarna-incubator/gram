import { IncomingMessage } from "http";
import * as jwt from "../auth/jwt";
import { UserToken } from "../auth/models/UserToken";
import cookie from "cookie";

export async function authenticate(
  request: IncomingMessage
): Promise<UserToken> {
  const c = request.headers.cookie;
  if (!c) throw new Error("unauthorized");
  const dict = cookie.parse(c);
  return await jwt.validateToken(dict.bearerToken);
}

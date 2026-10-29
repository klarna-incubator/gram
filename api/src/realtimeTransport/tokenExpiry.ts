import { Request } from "express";

/**
 * The expiry (epoch ms) of the bearer token on a request, if it is a JWT with
 * an `exp` claim. The signature was already checked by the auth middleware.
 */
export function bearerTokenExpiry(req: Request): number | undefined {
  const auth = req.headers["authorization"];
  const token = auth?.replace(/^bearer /i, "");
  return jwtExpiry(token);
}

export function jwtExpiry(token?: string): number | undefined {
  try {
    const payload = JSON.parse(
      Buffer.from(token?.split(".")[1] ?? "", "base64url").toString()
    );
    return typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

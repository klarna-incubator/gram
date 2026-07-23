/**
 * Auth middleware
 * @exports auth
 */
import IdentityProviderRegistry from "@gram/core/dist/auth/IdentityProviderRegistry.js";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { UserToken } from "@gram/core/dist/auth/models/UserToken.js";
import * as Sentry from "@sentry/node";
import { NextFunction, Response, Request } from "express";
import log4js from "log4js";
import { hasSentry } from "../util/sentry.js";

const log = log4js.getLogger("authMw");

/**
 * Resolve a Gram UserToken (identity + roles + teams) for a subject, exactly
 * as the interactive login (`token/get.ts`) does. Used to build `req.user` for
 * a request authenticated via a presented bearer token. Returns null if the
 * subject does not map to a Gram user.
 */
async function resolveUserToken(
  dal: DataAccessLayer,
  req: Request,
  sub: string
): Promise<UserToken | null> {
  const user = await dal.userHandler.lookupUser({ currentRequest: req }, sub);
  if (!user) {
    return null;
  }
  const roles = await dal.authzProvider.getRolesForUser(sub);
  const teams = await dal.teamHandler.getTeamsForUser(
    { currentRequest: req },
    sub
  );
  return { ...user, sub, roles, teams };
}

/**
 * Attempt to authenticate a presented bearer access token via any identity
 * provider that supports bearer-token auth (`getIdentityFromToken`). Returns
 * the resolved UserToken, or null if no provider validates the token / it maps
 * to no user.
 */
async function tryBearerToken(
  dal: DataAccessLayer,
  req: Request,
  token: string
): Promise<UserToken | null> {
  for (const provider of IdentityProviderRegistry.values()) {
    if (!provider.getIdentityFromToken) {
      continue;
    }
    try {
      const result = await provider.getIdentityFromToken(token, {
        currentRequest: req,
      });
      if (result?.status === "ok") {
        return await resolveUserToken(dal, req, result.identity.sub);
      }
    } catch (error: any) {
      log.warn("Bearer token validation error", {
        payload: { error: error?.message },
      });
    }
  }
  return null;
}

/**
 * Validates the incoming bearer token and, if valid, sets `req.user`. Two token
 * types are accepted, tried in order:
 *   1. A Gram session JWT (HS512) — the interactive web-UI path (unchanged).
 *   2. A bearer access token from a trusted OIDC provider — the machine-to-
 *      machine path (e.g. the Klarna MCP via KEP CLI token exchange). Either
 *      way the resolved `req.user` carries the caller's own roles/teams, so
 *      per-model authorization governs what the request can do.
 */
export function validateTokenMiddleware(dal: DataAccessLayer) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let token = "";
    const authString = req.headers["authorization"] || "no-auth";
    if (authString.toLowerCase().startsWith("bearer ")) {
      token = authString.replace(/^bearer /i, "");
    }

    if (token) {
      try {
        req.user = await jwt.validateToken(token);
      } catch (error: any) {
        // Not a valid Gram session JWT — fall back to bearer-token auth.
        const bearerUser = await tryBearerToken(dal, req, token);
        if (bearerUser) {
          req.user = bearerUser;
        } else {
          log.info("Token validation failed", {
            payload: { error: error.message },
          });
          // TODO: Error on suspicious errors (failed signature)
        }
      }

      if (req.user && hasSentry()) {
        Sentry.setUser({ email: req.user.sub, roles: req.user.roles });
      }
    }
    next();
  };
}

export async function authRequiredMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }
  next();
}

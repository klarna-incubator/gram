/**
 * Auth middleware
 * @exports auth
 */
import IdentityProviderRegistry from "@gram/core/dist/auth/IdentityProviderRegistry.js";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { resolveUserToken } from "@gram/core/dist/auth/resolveUserToken.js";
import { UserToken } from "@gram/core/dist/auth/models/UserToken.js";
import * as Sentry from "@sentry/node";
import { NextFunction, Response, Request } from "express";
import log4js from "log4js";
import { hasSentry } from "../util/sentry.js";

const log = log4js.getLogger("authMw");

async function tryGramTokenValidation(
  dal: DataAccessLayer,
  req: Request,
  token: string,
): Promise<UserToken | null> {
  try {
    return await jwt.validateToken(token);
  } catch (error: any) {
    log.warn("Gram token validation error", {
      payload: { error: error?.message },
      meta: { provider: "gram" },
    });
    return null;
  }
}

/**
 * Attempt to authenticate a presented bearer access token via any identity
 * provider that supports bearer-token auth (`getIdentityFromToken`). Returns
 * the resolved UserToken, or null if no provider validates the token / it maps
 * to no user.
 */
async function tryIdentityProvidersToken(
  dal: DataAccessLayer,
  req: Request,
  token: string,
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
        return await resolveUserToken(
          dal,
          { currentRequest: req },
          result.identity.sub,
        );
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
 * Authenticates the request through any identity provider that supports
 * request-based auth (`authenticateRequest`), e.g. a header set by a trusted
 * proxy. Returns the first UserToken a provider returns, or null.
 */
async function tryAuthenticateRequest(req: Request): Promise<UserToken | null> {
  for (const provider of IdentityProviderRegistry.values()) {
    if (!provider.authenticateRequest) {
      continue;
    }
    try {
      const user = await provider.authenticateRequest({ currentRequest: req });
      if (user) {
        return user;
      }
    } catch (error: any) {
      log.warn("Request authentication error", {
        payload: { error: error?.message },
        meta: { provider: provider.key },
      });
    }
  }
  return null;
}

/**
 * Validates the incoming request and, if authenticated, sets `req.user`. The
 * following are tried in order:
 *   1. A Gram session JWT (HS512) — the interactive web-UI path.
 *   2. A bearer access token from a trusted OIDC provider — the machine-to-
 *      machine path (e.g. the Klarna MCP via KEP CLI token exchange).
 *   3. Request-based auth by an identity provider (`authenticateRequest`),
 *      only if no bearer token authenticated the request.
 * In every case the resolved `req.user` carries the caller's own roles/teams,
 * so per-model authorization governs what the request can do.
 */
export function validateTokenMiddleware(dal: DataAccessLayer) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let bearerToken = "";
    const authString = req.headers["authorization"] || "no-auth";
    if (authString.toLowerCase().startsWith("bearer ")) {
      bearerToken = authString.replace(/^bearer /i, "");
    }

    if (bearerToken) {
      const gramTokenUser = await tryGramTokenValidation(dal, req, bearerToken);

      if (gramTokenUser) {
        req.user = gramTokenUser;
      }

      if (!req.user) {
        const idProviderTokenUser = await tryIdentityProvidersToken(
          dal,
          req,
          bearerToken,
        );
        if (idProviderTokenUser) {
          req.user = idProviderTokenUser;
        }
      }
    }

    if (!req.user) {
      const requestUser = await tryAuthenticateRequest(req);
      if (requestUser) {
        req.user = requestUser;
      }
    }

    if (req.user && hasSentry()) {
      Sentry.setUser({ email: req.user.sub, roles: req.user.roles });
    }
    next();
  };
}

export async function authRequiredMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }
  next();
}

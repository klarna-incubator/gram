import { NextFunction, Response } from "express";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { GramRequest } from "@gram/core/dist/data/providers/RequestContext.js";
import { CurrentAuthz } from "@gram/core/dist/auth/CurrentAuthz.js";

export interface AuthzMiddlewareOptions {
  dal: DataAccessLayer;
}

interface AuthzMiddlewareFunction {
  authz: Authz;
  (req: GramRequest, resp: Response, next: NextFunction): void;
  is<Role>(
    role: Role
  ): (req: GramRequest, resp: Response, next: NextFunction) => void;
  all<Role>(
    ...roles: [Role]
  ): (req: GramRequest, resp: Response, next: NextFunction) => void;
  any<Role>(
    ...roles: [Role]
  ): (req: GramRequest, resp: Response, next: NextFunction) => void;
}

export function AuthzMiddleware(
  options: AuthzMiddlewareOptions
): AuthzMiddlewareFunction {
  const authz = new Authz(options);
  const authzMiddlewareFunction = (
    req: GramRequest,
    resp: Response,
    next: NextFunction
  ) => {
    authz.handleRequest(req);
    next();
  };
  const extension: any = {
    authz,
    any: (...roles: Role[]) => {
      return (req: GramRequest, resp: Response, next: NextFunction) => {
        authz.handleRequest(req).any(...roles);
        next();
      };
    },

    all: (...roles: Role[]) => {
      return (req: GramRequest, resp: Response, next: NextFunction) => {
        authz.handleRequest(req).all(...roles);
        next();
      };
    },

    is: (role: Role) => {
      return (req: GramRequest, resp: Response, next: NextFunction) => {
        authz.handleRequest(req).is(role);
        next();
      };
    },
  };

  return Object.assign(authzMiddlewareFunction, extension);
}

export class Authz {
  options: AuthzMiddlewareOptions;

  constructor(options: AuthzMiddlewareOptions) {
    this.options = options;
  }

  public handleRequest(req: GramRequest) {
    req.authz = new CurrentAuthz(req, this.options.dal);
    return req.authz;
  }
}

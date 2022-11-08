/**
 * Copied from an unfinished NPM package.
 * Will refactor later, either to move it back to the NPM package or distribute it better across this app
 */

import { NextFunction, Request, Response } from "express";
import {
  hasPermissionsForModel,
  hasPermissionsForModelId,
  hasPermissionsForSystemId,
  getPermissionsForModel,
  Permission,
  hasAnyPermissionsForModelId,
} from "../auth/authorization";
import { Role } from "../auth/models/Role";
import { AuthzError } from "../auth/AuthzError";
import { UserToken } from "../auth/models/UserToken";
import Model from "../data/models/Model";
import { DataAccessLayer } from "../data/dal";

export interface AuthzMiddlewareOptions {
  dal: DataAccessLayer;
}

interface AuthzMiddlewareFunction {
  authz: Authz;
  (req: Request, resp: Response, next: NextFunction): void;
  is<Role>(
    role: Role
  ): (req: Request, resp: Response, next: NextFunction) => void;
  all<Role>(
    ...roles: [Role]
  ): (req: Request, resp: Response, next: NextFunction) => void;
  any<Role>(
    ...roles: [Role]
  ): (req: Request, resp: Response, next: NextFunction) => void;
}

export function AuthzMiddleware(
  options: AuthzMiddlewareOptions
): AuthzMiddlewareFunction {
  const authz = new Authz(options);
  const authzMiddlewareFunction = (
    req: Request,
    resp: Response,
    next: NextFunction
  ) => {
    authz.handleRequest(req);
    next();
  };
  const extension: any = {
    authz,
    any: (...roles: Role[]) => {
      return (req: Request, resp: Response, next: NextFunction) => {
        authz.handleRequest(req).any(...roles);
        next();
      };
    },

    all: (...roles: Role[]) => {
      return (req: Request, resp: Response, next: NextFunction) => {
        authz.handleRequest(req).all(...roles);
        next();
      };
    },

    is: (role: Role) => {
      return (req: Request, resp: Response, next: NextFunction) => {
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

  public handleRequest(req: Request) {
    req.authz = new CurrentAuthz(req.user, this.options.dal);
    return req.authz;
  }
}

/**
 * Current User's Authorization. Interface on the request level to
 * check for authorization.
 */
export class CurrentAuthz {
  public user: UserToken;
  public check: Checks;
  private dal: DataAccessLayer;

  constructor(user: UserToken, dal: DataAccessLayer) {
    this.user = user;
    this.dal = dal;
    this.check = new Checks(user);
  }

  public any(...roles: Role[]) {
    if (!this.check.any(...roles))
      throw new AuthzError(
        `required any role: ${roles}, but user had roles ${this.user.roles}`
      );
  }

  public all(...roles: Role[]) {
    if (!this.check.all(...roles))
      throw new AuthzError(
        `required all role: ${roles}, but user had roles ${this.user.roles}`
      );
  }

  public is(role: Role) {
    if (!this.check.is(role))
      throw new AuthzError(
        `required role: ${role}, but user had roles ${this.user.roles}`
      );
  }

  public async hasPermissionsForModelId(
    modelId: string,
    ...expectedPermissions: Permission[]
  ) {
    await hasPermissionsForModelId(
      this.dal,
      modelId,
      this.user,
      expectedPermissions
    );
  }

  public async hasAnyPermissionsForModelId(
    modelId: string,
    ...anyOfThesePermissions: Permission[]
  ) {
    await hasAnyPermissionsForModelId(
      this.dal,
      modelId,
      this.user,
      anyOfThesePermissions
    );
  }

  public async hasPermissionsForModel(
    model: Model,
    ...expectedPermissions: Permission[]
  ) {
    await hasPermissionsForModel(model, this.user, expectedPermissions);
  }

  public async hasPermissionsForSystemId(
    systemId: string,
    ...expectedPermissions: Permission[]
  ) {
    await hasPermissionsForSystemId(systemId, this.user, expectedPermissions);
  }

  public async getPermissionsForModel(model: Model) {
    return await getPermissionsForModel(model, this.user);
  }
}

class Checks {
  user: UserToken;

  constructor(user: UserToken) {
    this.user = user;
  }

  public any(...roles: Role[]) {
    if (roles.length === 0) return true;
    for (let i = 0; i < roles.length; i++) {
      if (this.user.roles.indexOf(roles[i]) > -1) return true;
    }
    return false;
  }

  public all(...roles: Role[]) {
    return roles.every((role) => this.is(role));
  }

  public is(role: Role) {
    return this.user.roles.includes(role);
  }
}

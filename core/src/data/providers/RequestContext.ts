import { Request } from "express";
import { CurrentAuthz } from "../../auth/CurrentAuthz.js";
import { UserToken } from "../../auth/models/UserToken.js";

export interface GramRequest extends Request {
  user: UserToken;
  authz: CurrentAuthz;
}

/**
 * Represent the the current context of the application, carrying
 * objects such as the current Express request object.
 */
export interface RequestContext {
  currentRequest?: GramRequest;
}

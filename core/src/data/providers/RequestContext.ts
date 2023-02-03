import { Request } from "express";
import { CurrentAuthz } from "../../auth/CurrentAuthz";
import { UserToken } from "../../auth/models/UserToken";

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

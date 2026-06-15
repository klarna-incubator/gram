import type { CurrentAuthz, UserToken } from "./util/requestExtension.js";

export {};

declare global {
  namespace Express {
    export interface Request {
      user: UserToken;
      authz: CurrentAuthz;
    }
  }
}

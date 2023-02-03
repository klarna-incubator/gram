import { CurrentAuthz, UserToken } from "../../util/requestExtension";

// to make the file a module and avoid the TypeScript error
export {};

declare global {
  namespace Express {
    export interface Request {
      user: UserToken;
      authz: CurrentAuthz;
    }
  }
}

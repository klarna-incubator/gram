declare namespace Express {
  export interface Request {
    user: import("../../auth/jwt").UserToken;
    authz: import("../../middlewares/authz").CurrentAuthz;
  }
}

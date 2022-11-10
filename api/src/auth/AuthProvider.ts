import { Request } from "express";
import { Provider } from "../util/provider";
import { UserToken } from "./models/UserToken";

export interface AuthProvider extends Provider {
  params(): Promise<object>;
  getIdentity(headers: Request): Promise<UserToken>;
}

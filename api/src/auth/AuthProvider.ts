import { IncomingHttpHeaders } from "http";
import { Provider } from "../util/provider";
import { UserToken } from "./models/UserToken";

export interface AuthProvider extends Provider {
  params(): Promise<object>;
  getIdentity(headers: IncomingHttpHeaders): Promise<UserToken>;
}

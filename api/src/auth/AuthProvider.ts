import { RequestContext } from "../data/providers/RequestContext";
import { Provider } from "../data/providers/Provider";
import { UserToken } from "./models/UserToken";

export interface AuthProvider extends Provider {
  /**
   * Provide whichever parameters the frontend needs to perform the authentication process.
   */
  params(ctx: RequestContext): Promise<object>;
  /**
   *
   * @param headers
   */
  getIdentity(ctx: RequestContext): Promise<UserToken>;
}

import { RequestContext } from "../data/providers/RequestContext";
import { Provider } from "../data/providers/Provider";
import { UserToken } from "./models/UserToken";

export type AuthProviderParams = {
  /**
   * Whether or not the frontend should display the auth mechanism on the frontend.
   *
   * If undefined or true, the auth provider will not be shown. So set to "false" for SSO etc, but "true" for
   * e.g. API tokens.
   */
  hideOnFrontend?: boolean;
  /**
   * Redirect URL that the Frontend will redirect to on auth (typically used by SSO providers).
   */
  redirectUrl?: string;
  /**
   * URL or path to icon/logo to represent the login method.
   */
  icon?: string;

  [key: string]: any;
};

export type LoginResult =
  | {
      status: "ok";
      token: UserToken;
    }
  | {
      status: "error";
      /**
       * Message displayed to user to explain why the login failed (e.g. in case of missing permissions)
       */
      message: string;
    };

export interface AuthProvider extends Provider {
  /**
   * Provide whichever parameters the frontend needs to perform the authentication process.
   */
  params(ctx: RequestContext): Promise<AuthProviderParams>;
  /**
   *
   * @param headers
   */
  getIdentity(ctx: RequestContext): Promise<LoginResult>;
}

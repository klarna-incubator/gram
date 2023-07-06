import { RequestContext } from "../data/providers/RequestContext";
import { Provider } from "../data/providers/Provider";
import { UserToken } from "./models/UserToken";

export enum AuthProviderFormType {
  redirect = "redirect",
  email = "email",
  // emailAndPassword = "emailAndPassword",
}

export type AuthProviderForm = {
  type: AuthProviderFormType;
  httpMethod: "GET" | "POST";
  /**
   * Could replace FormType here with a more generic "fields" array, but that would require a lot of changes to the
   * frontend.
   */
  // fields?: Array<{}>;
  /**
   * Redirect URL that the Frontend will redirect to on auth (typically used by SSO providers).
   */
  redirectUrl?: string;
  /**
   * URL or path to icon/logo to represent the login method.
   */
  icon?: string;
};

export type AuthProviderParams = {
  /**
   * Unique key to identify the auth provider by programmatically.
   */
  key: string;
  // /**
  //  * Whether or not the frontend should display the auth mechanism on the frontend.
  //  *
  //  * If undefined or true, the auth provider will not be shown. So set to "false" for SSO etc, but "true" for
  //  * e.g. API tokens.
  //  */
  // hideOnFrontend?: boolean;
  /**
   * Type of auth provider. If undefined, the frontend will not display the auth provider.
   */
  form?: AuthProviderForm;

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
    }
  | {
      /**
       * In case the login process is still ongoing but the provider still needs to provide some sort of feedback.
       * e.g. in the case of magic link, the user has been sent an email but has not yet clicked the link.
       */
      status: "info";
      message: string;
    };

export interface AuthProvider extends Provider {
  /**
   * Provide whichever parameters the frontend needs to perform the authentication process.
   */
  params(ctx: RequestContext): Promise<AuthProviderParams>;

  /**
   * Method to handle the form submission (if there is one)
   * @param headers
   */
  getIdentity(ctx: RequestContext): Promise<LoginResult>;
}

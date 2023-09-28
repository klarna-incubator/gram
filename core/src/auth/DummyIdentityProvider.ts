import { RequestContext } from "../data/providers/RequestContext.js";
import {
  IdentityProvider,
  IdentityProviderParams,
  LoginResult,
} from "./IdentityProvider.js";

export class DummyIdentityProvider implements IdentityProvider {
  key = "dummy";
  params(ctx: RequestContext): Promise<IdentityProviderParams> {
    throw new Error("Method not implemented.");
  }
  getIdentity(ctx: RequestContext): Promise<LoginResult> {
    throw new Error("Method not implemented.");
  }
}

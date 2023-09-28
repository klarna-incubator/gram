import { RequestContext } from "../../data/providers/RequestContext.js";
import { IdentityProvider, LoginResult } from "../IdentityProvider.js";
import { Role } from "../models/Role.js";

export default class MockAuthProvider implements IdentityProvider {
  key = "mock";

  async params(ctx: RequestContext) {
    return {
      key: this.key,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getIdentity(ctx: RequestContext): Promise<LoginResult> {
    return {
      status: "ok",
      identity: {
        sub: "payload",
        // roles: [Role.User],
        // teams: [{ name: "mocked team", id: "41" }],
      },
    };
  }
}

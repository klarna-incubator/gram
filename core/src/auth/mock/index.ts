import { RequestContext } from "../../data/providers/RequestContext";
import { AuthProvider, LoginResult } from "../AuthProvider";
import { Role } from "../models/Role";

export default class MockAuthProvider implements AuthProvider {
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
      token: {
        sub: "payload",
        roles: [Role.User],
        teams: [{ name: "mocked team", id: "41" }],
      },
    };
  }
}

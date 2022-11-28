import { UserToken } from "../models/UserToken";
import { AuthProvider } from "../AuthProvider";
import { Role } from "../models/Role";
import { RequestContext } from "../../data/providers/RequestContext";

export default class MockAuthProvider implements AuthProvider {
  key = "mock";

  async params(ctx: RequestContext) {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getIdentity(ctx: RequestContext): Promise<UserToken> {
    return {
      sub: "payload",
      roles: [Role.User],
      teams: [{ name: "mocked team", id: "41" }],
    };
  }
}

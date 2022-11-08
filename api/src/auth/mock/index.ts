import { IncomingHttpHeaders } from "http";
import { UserToken } from "../models/UserToken";
import { AuthProvider } from "../AuthProvider";
import { Role } from "../models/Role";

export default class MockAuthProvider implements AuthProvider {
  key = "mock";

  async params() {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getIdentity(headers: IncomingHttpHeaders): Promise<UserToken> {
    return {
      sub: "payload",
      roles: [Role.User],
      teams: [{ name: "mocked team", id: "41" }],
    };
  }
}

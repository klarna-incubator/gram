import { UserToken } from "../models/UserToken";
import { AuthProvider } from "../AuthProvider";
import { Role } from "../models/Role";
import { Request } from "express";

export default class MockAuthProvider implements AuthProvider {
  key = "mock";

  async params() {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getIdentity(request: Request): Promise<UserToken> {
    return {
      sub: "payload",
      roles: [Role.User],
      teams: [{ name: "mocked team", id: "41" }],
    };
  }
}

import IdentityProviderRegistry from "@gram/core/dist/auth/IdentityProviderRegistry.js";
import {
  IdentityProvider,
  LoginResult,
} from "@gram/core/dist/auth/IdentityProvider.js";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import { UserToken } from "@gram/core/dist/auth/models/UserToken.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import request from "supertest";
import { createTestApp } from "../test-util/app.js";
import { sampleUserToken } from "../test-util/sampleTokens.js";
import { sampleUser } from "../test-util/sampleUser.js";

class MockHeaderProvider implements IdentityProvider {
  key = "header";

  async params() {
    return { key: this.key };
  }

  async getIdentity(): Promise<LoginResult> {
    return { status: "error", message: "Not interactive" };
  }

  async authenticateRequest(ctx: RequestContext): Promise<UserToken | null> {
    const caller = ctx.currentRequest?.headers["x-test-caller"];
    if (typeof caller !== "string") {
      return null;
    }
    return { sub: caller, roles: [Role.User], teams: [] };
  }
}

describe("request auth", () => {
  let app: Express.Application;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    IdentityProviderRegistry.clear();
    IdentityProviderRegistry.set("header", new MockHeaderProvider());
  });

  it("should authenticate a request through a provider's authenticateRequest", async () => {
    const res = await request(app)
      .get("/api/v1/user")
      .set("x-test-caller", "service:docs");
    expect(res.status).toBe(200);
    expect(res.body.sub).toBe("service:docs");
  });

  it("should prefer a valid Gram session token over request auth", async () => {
    const res = await request(app)
      .get("/api/v1/user")
      .set("Authorization", await sampleUserToken())
      .set("x-test-caller", "service:docs");
    expect(res.status).toBe(200);
    expect(res.body.sub).toBe(sampleUser.sub);
  });

  it("should return 401 when no provider authenticates the request", async () => {
    const res = await request(app).get("/api/v1/user");
    expect(res.status).toBe(401);
  });
});

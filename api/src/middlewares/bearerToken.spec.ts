import IdentityProviderRegistry from "@gram/core/dist/auth/IdentityProviderRegistry.js";
import { IdentityProvider, LoginResult } from "@gram/core/dist/auth/IdentityProvider.js";
import request from "supertest";
import { createTestApp } from "../test-util/app.js";
import { sampleUser } from "../test-util/sampleUser.js";

/**
 * Mock provider exercising the bearer-token path end-to-end through the real
 * app (validateTokenMiddleware -> resolve roles/teams). The JWKS/claim
 * validation itself lives in the OIDC provider; here the token "valid-token"
 * stands in for a token that passed that validation.
 */
class MockBearerProvider implements IdentityProvider {
  key = "oidc";

  async params() {
    return { key: this.key };
  }

  async getIdentity(): Promise<LoginResult> {
    return { status: "ok", identity: sampleUser };
  }

  async getIdentityFromToken(token: string): Promise<LoginResult> {
    return token === "valid-token"
      ? { status: "ok", identity: sampleUser }
      : { status: "error", message: "Invalid token" };
  }
}

describe("bearer token auth", () => {
  let app: Express.Application;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    IdentityProviderRegistry.clear();
    IdentityProviderRegistry.set("oidc", new MockBearerProvider());
  });

  it("should authenticate a read (GET) request with a valid bearer token", async () => {
    const res = await request(app)
      .get("/api/v1/user")
      .set("Authorization", "bearer valid-token");
    expect(res.status).toBe(200);
  });

  it("should return 401 for a GET request with an invalid bearer token", async () => {
    const res = await request(app)
      .get("/api/v1/user")
      .set("Authorization", "bearer not-valid");
    expect(res.status).toBe(401);
  });

  it("should not block a mutating request at the auth layer (per-model authz decides)", async () => {
    // A bearer-authed mutating request is authenticated and passes the auth
    // layer — it is NOT rejected with 401 and reaches normal per-model
    // authorization / handler logic.
    const res = await request(app)
      .post("/api/v1/models")
      .set("Authorization", "bearer valid-token")
      .send({ some: "payload" });
    expect(res.status).not.toBe(401);
  });
});

import IdentityProviderRegistry from "@gram/core/dist/auth/IdentityProviderRegistry.js";
import MockAuthProvider from "@gram/core/dist/auth/mock/MockAuthProvider.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUser } from "../../../../test-util/sampleUser.js";
import { jest } from "@jest/globals";

describe("token.get", () => {
  let app: any;
  const dummyAuth = new MockAuthProvider();
  const getIdentity = jest.spyOn(dummyAuth, "getIdentity");

  beforeAll(async () => {
    ({ app } = await createTestApp());
    IdentityProviderRegistry.clear();
    IdentityProviderRegistry.set(dummyAuth.key, dummyAuth);
  });

  beforeEach(() => {
    getIdentity.mockImplementation(async () => ({
      status: "ok",
      identity: sampleUser,
    }));
  });

  it("should return 400 on request without provider query", async () => {
    const res = await request(app).get("/api/v1/auth/token");
    expect(res.status).toBe(400);
  });

  it("should return 400 on invalid provider query", async () => {
    const res = await request(app).get("/api/v1/auth/token?provider=invalid");
    expect(res.status).toBe(400);
  });

  it("should return 500 on unknown error with getIdentity", async () => {
    getIdentity.mockImplementation(async () => {
      throw new Error("unknown error");
    });

    const res = await request(app).get("/api/v1/auth/token?provider=mock");
    expect(res.status).toBe(500);
  });

  it("should return 200 with tokens when everything passes", async () => {
    const res = await request(app).get("/api/v1/auth/token?provider=mock");
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(jwtPattern);
  });

  afterAll(() => {
    getIdentity.mockReset();
  });
});

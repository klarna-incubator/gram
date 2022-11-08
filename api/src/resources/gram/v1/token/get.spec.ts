import cookie from "cookie";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app";
import AuthProviderRegistry from "../../../../auth/AuthProviderRegistry";
import MockAuthProvider from "../../../../auth/mock";
import { createPostgresPool } from "../../../../data/postgres";
import { sampleUser } from "../../../../test-util/sampleUser";

describe("token.get", () => {
  let app: any;
  const dummyAuth = new MockAuthProvider();
  const getIdentity = jest.spyOn(dummyAuth, "getIdentity");

  beforeAll(async () => {
    const pool = await createPostgresPool();
    ({ app } = await createTestApp());
    AuthProviderRegistry.clear();
    AuthProviderRegistry.set(dummyAuth.key, dummyAuth);
  });

  beforeEach(() => {
    getIdentity.mockImplementation(async () => sampleUser);
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
    const cookieHeader = res.headers["set-cookie"][0];
    const cookies = cookie.parse(cookieHeader);

    expect(res.status).toBe(200);
    expect(cookies.bearerToken).toMatch(jwtPattern);
    expect(cookieHeader).toMatch(/HttpOnly$/);
    expect(res.body.token).toMatch(jwtPattern);
  });

  afterAll(() => {
    getIdentity.mockReset();
  });
});

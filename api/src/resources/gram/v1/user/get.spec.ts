import request from "supertest";

import { createTestApp } from "../../../../test-util/app.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";

const token = await sampleUserToken();

describe("user.get", () => {
  let app: any;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/user");
    expect(res.status).toBe(401);
  });

  it("should return 401 on invalid authenticated request", async () => {
    const res = await request(app)
      .get("/api/v1/user")
      .set("Authorization", "bearer invalid_token");
    expect(res.status).toBe(401);
  });

  it("should return 200 with user object on valid request", async () => {
    const res = await request(app)
      .get("/api/v1/user")
      .set("Authorization", token);
    expect(res.status).toBe(200);
    expect(res.body.sub).toBe("test@abc.xyz");
  });
});

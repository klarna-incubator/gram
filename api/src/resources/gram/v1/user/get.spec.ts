import request from "supertest";

import * as jwt from "@gram/core/dist/auth/jwt.js";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUser } from "../../../../test-util/sampleUser.js";

const validate = jest.spyOn(jwt, "validateToken");

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
    validate.mockImplementation(async () => {
      throw new Error("forbidden");
    });
    const res = await request(app)
      .get("/api/v1/user")
      .set("Authorization", "bearer invalid_token");
    expect(res.status).toBe(401);
  });

  it("should return 200 with user object on valid request", async () => {
    validate.mockImplementation(async () => sampleUser);
    const res = await request(app)
      .get("/api/v1/user")
      .set("Authorization", "bearer valid_token");
    expect(res.status).toBe(200);
    expect(res.body.sub).toBe("test@abc.xyz");
  });

  afterAll(() => {
    validate.mockRestore();
  });
});

import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import { createTestApp } from "../../../../test-util/app";
import { sampleUser } from "../../../../test-util/sampleUser";

describe("system-compliance", () => {
  const validate = jest.spyOn(jwt, "validateToken");

  let app: any;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  beforeEach(() => {
    validate.mockImplementation(async () => sampleUser);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/system-properties/123");
    expect(res.status).toBe(401);
  });

  // Very basic test to just ensure the route does not crash on the query
  it("should work (return 200)", async () => {
    const res = await request(app)
      .get("/api/v1/reports/system-compliance")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
  });

  it("should work with pagesize (return 200)", async () => {
    const res = await request(app)
      .get("/api/v1/reports/system-compliance?pagesize=10")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
  });

  it("should work with pagesize and page (return 200)", async () => {
    const res = await request(app)
      .get("/api/v1/reports/system-compliance?pagesize=10&page=3")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
  });

  afterAll(() => {
    validate.mockRestore();
  });
});

import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";

describe("system-compliance", () => {
  let app: any;
  let token = "";

  beforeAll(async () => {
    token = await sampleUserToken();
    ({ app } = await createTestApp());
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/system-properties/123");
    expect(res.status).toBe(401);
  });

  // Very basic test to just ensure the route does not crash on the query
  it("should work (return 200)", async () => {
    const res = await request(app)
      .get("/api/v1/reports/system-compliance")
      .set("Authorization", token);

    expect(res.status).toBe(200);
  });

  it("should work with pagesize (return 200)", async () => {
    const res = await request(app)
      .get("/api/v1/reports/system-compliance?pagesize=10")
      .set("Authorization", token);

    expect(res.status).toBe(200);
  });

  it("should work with pagesize and page (return 200)", async () => {
    const res = await request(app)
      .get("/api/v1/reports/system-compliance?pagesize=10&page=3")
      .set("Authorization", token);

    expect(res.status).toBe(200);
  });
});

import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { jest } from "@jest/globals";

describe("token.delete", () => {
  let app: any;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  it("should return 200", async () => {
    const res = await request(app).delete("/api/v1/auth/token");
    expect(res.status).toBe(200);
  });
});

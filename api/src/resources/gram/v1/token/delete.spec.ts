import request from "supertest";
import { createTestApp } from "../../../../test-util/app";
import { createPostgresPool } from "../../../../data/postgres";

describe("token.delete", () => {
  let app: any;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    ({ app } = await createTestApp());
  });

  it("should return 200", async () => {
    const res = await request(app).delete("/api/v1/auth/token");
    expect(res.status).toBe(200);
  });
});

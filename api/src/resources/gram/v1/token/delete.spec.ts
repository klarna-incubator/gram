import request from "supertest";
import { createTestApp } from "../../../../test-util/app";
import { createPostgresPool } from "../../../../data/postgres";

describe("token.delete", () => {
  let app: any;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    ({ app } = await createTestApp());
  });

  it("should return 200 with set-cookie", async () => {
    const res = await request(app).delete("/api/v1/auth/token");
    expect(res.status).toBe(200);
    expect(res.headers).toEqual(
      expect.objectContaining({ "set-cookie": expect.anything() })
    );
  });
});

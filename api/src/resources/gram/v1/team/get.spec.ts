import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleTeam } from "../../../../test-util/sampleTeam.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";

const token = await sampleUserToken();

describe("team.get", () => {
  let app: any;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/teams/123");
    expect(res.status).toBe(401);
  });

  it("should return 404 on invalid team id", async () => {
    const res = await request(app)
      .get("/api/v1/teams/234")
      .set("Authorization", token);

    expect(res.status).toBe(404);
  });

  it("should return 200 with dummy data", async () => {
    const res = await request(app)
      .get("/api/v1/teams/" + sampleTeam.id)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.team).toEqual(sampleTeam);
  });
});

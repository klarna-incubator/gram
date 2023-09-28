import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";

/**
 * Tests are based on the classes added in the test-util/classes.json
 */
describe("component-class.search", () => {
  let app: any;
  let token = "";

  beforeAll(async () => {
    token = await sampleUserToken();
    ({ app } = await createTestApp());
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get(
      "/api/v1/component-class?type=process&search=a"
    );
    expect(res.status).toBe(401);
  });

  it("should return 200 and a list", async () => {
    const res = await request(app)
      .get("/api/v1/component-class?type=process&search=S")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.classes).toHaveLength(2);
  });

  it("should find S3 under datastore", async () => {
    const res = await request(app)
      .get("/api/v1/component-class?type=datastore&search=S3")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.count).toBeLessThan(50);
    expect(res.body.truncated).toEqual(false); // If this fails we might want to revise the search algorithm to be more precise.
  });

  it("should return empty array on no result", async () => {
    const res = await request(app)
      .get(
        "/api/v1/component-class?type=datastore&search=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
      )
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.count).toEqual(0);
    expect(res.body.classes).toHaveLength(0);
  });

  it("should return 400 on invalid type", async () => {
    let res = await request(app)
      .get("/api/v1/component-class?type=elephant&search=a")
      .set("Authorization", token);

    expect(res.status).toBe(400);

    res = await request(app)
      .get("/api/v1/component-class?type[]=elephant&search=a")
      .set("Authorization", token);

    expect(res.status).toBe(400);
  });

  it("should return 400 on invalid search", async () => {
    const res = await request(app)
      .get("/api/v1/component-class?type=elephant&search[]=a")
      .set("Authorization", token);

    expect(res.status).toBe(400);
  });
});

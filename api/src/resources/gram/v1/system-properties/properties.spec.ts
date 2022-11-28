import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import { SystemPropertyHandler } from "../../../../data/SystemPropertyHandler";
import { sampleUser } from "../../../../test-util/sampleUser";
import { createTestApp } from "../../../../test-util/app";

describe("system-properties.properties", () => {
  let getProperties: any;
  let sysPropHandler: SystemPropertyHandler;
  let app: any;
  const validate = jest.spyOn(jwt, "validateToken");

  beforeAll(async () => {
    ({
      app,
      dal: { sysPropHandler },
    } = await createTestApp());

    getProperties = jest.spyOn(sysPropHandler, "getProperties");
  });

  beforeEach(() => {
    validate.mockImplementation(async () => sampleUser);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/system-properties");
    expect(res.status).toBe(401);
  });

  it("should return empty list if no registered properties", async () => {
    getProperties.mockImplementation(() => {
      return [];
    });

    const res = await request(app)
      .get("/api/v1/system-properties")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.properties).toStrictEqual([]);
  });

  afterAll(() => {
    validate.mockRestore();
  });
});

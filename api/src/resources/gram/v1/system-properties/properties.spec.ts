import * as jwt from "@gram/core/dist/auth/jwt.js";
import { SystemPropertyHandler } from "@gram/core/dist/data/system-property/SystemPropertyHandler.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUser } from "../../../../test-util/sampleUser.js";
import { jest } from "@jest/globals";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";

describe("system-properties.properties", () => {
  let getProperties: any;
  let sysPropHandler: SystemPropertyHandler;
  let app: any;
  let token = "";

  beforeAll(async () => {
    token = await sampleUserToken();
    ({
      app,
      dal: { sysPropHandler },
    } = await createTestApp());

    getProperties = jest.spyOn(sysPropHandler, "getProperties");
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
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.properties).toStrictEqual([]);
  });
});

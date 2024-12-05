import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { testResourceProvider } from "../../../../test-util/testResourceHandler.js";
import request from "supertest";
import { createSampleModel } from "../../../../test-util/model.js";
describe("getResources", () => {
  let app: any;
  let token: string;
  let dal: DataAccessLayer;
  let validModelId: string;
  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
    token = await sampleUserToken();
    validModelId = await createSampleModel(dal);
    //dal.resourceHandler.register(testResourceProvider);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/resources/12323");
    expect(res.status).toBe(401);
  });
  it("should return 401 when using invalid user token", async () => {
    const res = await request(app)
      .get("/api/v1/resources/12323")
      .set("Authorization", "invalidtoken");
    expect(res.status).toBe(401);
  });

  it("should return 200 on successful get resources", async () => {
    const res = await request(app)
      .get("/api/v1/resources/" + validModelId)
      .set("Authorization", token);
    expect(res.status).toBe(200);
  });

  it("should return an empty list if no resource provider is registered ", async () => {
    const res = await request(app)
      .get("/api/v1/resources/" + validModelId)
      .set("Authorization", token);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toEqual(0);
  });

  it("should return the resources from the registered resource providers", async () => {
    dal.resourceHandler.register(testResourceProvider);
    const res = await request(app)
      .get("/api/v1/resources/" + validModelId)
      .set("Authorization", token);
    const result = res.body[0];
    expect(result.id).toEqual("test-resource-id");
    expect(result.displayName).toEqual("Test Resource");
    expect(result.type).toEqual("external entity");
    expect(result.systemId).toEqual("another-mocked-system-id");
  });
});

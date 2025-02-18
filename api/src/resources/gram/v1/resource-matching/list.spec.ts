import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { createTestApp } from "../../../../test-util/app.js";
import request from "supertest";
import { randomUUID } from "crypto";
import { createSampleModel } from "../../../../test-util/model.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import ResourceMatching from "@gram/core/dist/data/matchings/ResourceMatching.js";

describe("ResourceMatchingDataService", () => {
  let token: string;
  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let validModelId: string;
  let validComponentId: string;
  const baseUrl = "/api/v1/resources-matching/";

  beforeAll(async () => {
    token = await sampleUserToken();
    ({ pool, app, dal } = await createTestApp());
    validComponentId = randomUUID();
    validModelId = await createSampleModel(dal, "some-owner", {
      components: [
        {
          id: validComponentId,
          name: "Component 1",
          description: "Component 1 description",
          type: "proc",
          x: 20,
          y: 30,
        },
        {
          id: randomUUID(),
          name: "Component 2",
          description: "Component 2 description",
          type: "ee",
          x: 0,
          y: 0,
        },
      ],
      dataFlows: [],
    });
  });

  afterAll(async () => {
    await _deleteAllTheThings(pool);
    await pool.end();
  });

  it("should return 401 on un-authenticated request", async () => {
    const modelId = randomUUID();
    const res = await request(app).get(baseUrl + modelId);
    expect(res.status).toBe(401);
  });

  it("should return 401 when using invalid user token", async () => {
    const modelId = randomUUID();
    const res = await request(app)
      .get(baseUrl + modelId)
      .set("Authorization", "invalidtoken");
    expect(res.status).toBe(401);
  });

  it("should return 404 with invalid model id", async () => {
    const modelId = randomUUID();
    const res = await request(app)
      .get(baseUrl + modelId)
      .set("Authorization", token);
    expect(res.status).toBe(404);
  });

  it("should return a list of resource matching for a model", async () => {
    //Creates a valid matching: model exist and component id belongs to model id
    const resourceId = randomUUID();
    const validMatching = new ResourceMatching(
      validModelId,
      resourceId,
      validComponentId,
      "valid_matching_test@klarna.com"
    );

    await dal.resourceMatchingService.create(validMatching);
    // Create an invalid matching: model exist but component id does not belong to model id
    const invalidComponentId = randomUUID();
    const invalidMatching = new ResourceMatching(
      validModelId,
      resourceId,
      invalidComponentId,
      "invalid_matching_test@klarna.com"
    );

    await dal.resourceMatchingService.create(invalidMatching);

    const res = await request(app)
      .get(baseUrl + validModelId)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.length).toEqual(1);
    expect(res.body[0].modelId).toEqual(validModelId);
    expect(res.body[0].resourceId).toEqual(resourceId);
    expect(res.body[0].componentId).toEqual(validComponentId);
    expect(res.body[0].createdBy).toEqual("valid_matching_test@klarna.com");
  });
});

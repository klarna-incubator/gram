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
    const res = await request(app)
      .delete(baseUrl + modelId)
      .send({
        modelId: modelId,
        resourceId: randomUUID(),
        componentId: randomUUID(),
      });
    expect(res.status).toBe(401);
  });

  it("should return 401 when using invalid user token", async () => {
    const modelId = randomUUID();
    const res = await request(app)
      .delete(baseUrl + modelId)
      .set("Authorization", "invalidtoken");
    expect(res.status).toBe(401);
  });

  it("should return 400 with invalid model id", async () => {
    const modelId = randomUUID();
    const res = await request(app)
      .delete(baseUrl + modelId)
      .set("Authorization", token);
    expect(res.status).toBe(400);
  });

  it("should return 400 with a valid model id and missing payload", async () => {
    const res = await request(app)
      .delete(baseUrl + validModelId)
      .set("Authorization", token);
    expect(res.status).toBe(400);
  });

  it("should return 400 with a valid model id and invalid payload", async () => {
    const res = await request(app)
      .delete(baseUrl + validModelId)
      .set("Authorization", token)
      .send({
        modelId: "invalid",
        resourceId: "invalid",
        componentId: "invalid",
      });
    expect(res.status).toBe(400);
  });

  it("should return 200 with a valid model id and valid payload", async () => {
    const res = await request(app)
      .delete(baseUrl + validModelId)
      .set("Authorization", token)
      .send({
        resourceId: randomUUID(),
        componentId: validComponentId,
      });
    expect(res.status).toBe(200);
  });

  it("should delete an existing matching", async () => {
    const resourceId = randomUUID();
    const matching = new ResourceMatching(
      validModelId,
      resourceId,
      validComponentId,
      "create_matching@klarna.com"
    );

    await dal.resourceMatchingService.create(matching);

    await request(app)
      .delete(baseUrl + validModelId)
      .set("Authorization", token)
      .send({
        resourceId: resourceId,
        componentId: validComponentId,
      });

    const query = `
        SELECT model_id, component_id, resource_id, created_by, deleted_at, updated_by
        FROM resource_matchings
        WHERE model_id = $1::uuid AND component_id = $2::uuid AND resource_id = $3::varchar`;

    const res = await pool.query(query, [
      validModelId,
      validComponentId,
      resourceId,
    ]);

    expect(res.rows.length).toBe(1);
    expect(res.rows[0].deleted_at).not.toBeNull();
    expect(res.rows[0].updated_by).toBe("test@abc.xyz");
  });
});

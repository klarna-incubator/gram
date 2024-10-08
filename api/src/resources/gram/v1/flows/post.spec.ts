import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createSampleModel } from "../../../../test-util/model.js";
import { randomUUID } from "crypto";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";

const token = await sampleUserToken();

describe("Flow.post", () => {
  let app: any;
  let dal: DataAccessLayer;

  let modelId: string;
  let dataFlowId: string;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    // await _deleteAllTheThings(pool);
    modelId = await createSampleModel(dal);
    dataFlowId = randomUUID();
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app)
      .post(`/api/v1/flows/model/${modelId}/dataflow/${dataFlowId}`)
      .send({
        summary: "Some summary",
        originComponentId: randomUUID(),
      });
    expect(res.status).toBe(401);
  });

  it("should return 200", async () => {
    const res = await request(app)
      .post(`/api/v1/flows/model/${modelId}/dataflow/${dataFlowId}`)
      .set("Authorization", token)
      .send({
        modelId,
        dataFlowId: randomUUID(),
        originComponentId: randomUUID(),
        summary: "Some summary",
      });
    console.log("res.body", res.body);

    expect(res.status).toBe(200);
  });

  it("should return 400 with invalid model id", async () => {
    const res = await request(app)
      .post(`/api/v1/flows/model/${modelId}/dataflow/${dataFlowId}`)
      .set("Authorization", token)
      .send({
        modelId: randomUUID(),
        dataFlowId: randomUUID(),
        originComponentId: randomUUID(),
        summary: "Some summary",
      });

    expect(res.status).toBe(400);
  });
});

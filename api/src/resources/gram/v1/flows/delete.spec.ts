import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import { randomUUID } from "crypto";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { sampleAttributes } from "./post.spec.js";

const token = await sampleUserToken();

describe("Flow.delete", () => {
  let app: any;
  let dal: DataAccessLayer;

  let modelId: string;
  let dataFlowId: string;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    await _deleteAllTheThings(dal.pool);
    modelId = await createSampleModel(dal);
    dataFlowId = randomUUID();
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  it("should return 401 on un-authenticated request", async () => {
    const postres = await request(app)
      .post(`/api/v1/flows/model/${modelId}/dataflow/${dataFlowId}`)
      .set("Authorization", token)
      .send({
        originComponentId: randomUUID(),
        summary: "Some summary",
        attributes: sampleAttributes(),
      });

    expect(postres.status).toBe(200);
    const flowId = postres.body.flow.id;

    const res = await request(app).delete(`/api/v1/flows/${flowId}`).send();

    expect(res.status).toBe(401);
  });

  it("should return 200", async () => {
    const postres = await request(app)
      .post(`/api/v1/flows/model/${modelId}/dataflow/${dataFlowId}`)
      .set("Authorization", token)
      .send({
        originComponentId: randomUUID(),
        summary: "Some summary",
        attributes: sampleAttributes(),
      });

    const flowId = postres.body.flow.id;

    const res = await request(app)
      .delete(`/api/v1/flows/${flowId}`)
      .set("Authorization", token)
      .send();

    expect(res.status).toBe(200);
  });

  it("should return 404 with invalid flow id", async () => {
    const flowId = randomUUID();
    const res = await request(app)
      .delete(`/api/v1/flows/${flowId}`)
      .set("Authorization", token)
      .send();

    expect(res.status).toBe(404);
  });
});

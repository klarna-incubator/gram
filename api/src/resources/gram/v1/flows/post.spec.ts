import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createSampleModel } from "../../../../test-util/model.js";
import { randomUUID } from "crypto";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { config } from "@gram/core/dist/config/index.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";

const token = await sampleUserToken();

export function sampleAttributes() {
  const attributes: any = {};
  config.attributes.flow.forEach((attr) => {
    if (attr.type === "text") {
      attributes[attr.key] = "some text";
    } else if (attr.type === "description") {
      attributes[attr.key] = "some description";
    } else if (attr.type === "select") {
      attributes[attr.key] = [attr.options[0]];
    }
  });

  return attributes;
}

describe("Flow.post", () => {
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
        originComponentId: randomUUID(),
        summary: "Some summary",
        attributes: sampleAttributes(),
      });

    // console.log("res.body", JSON.stringify(res.body));

    expect(res.status).toBe(200);
  });

  it("should return 404 with invalid model id", async () => {
    const modelId = randomUUID();
    const dataFlowId = randomUUID();
    const res = await request(app)
      .post(`/api/v1/flows/model/${modelId}/dataflow/${dataFlowId}`)
      .set("Authorization", token)
      .send({
        originComponentId: randomUUID(),
        summary: "Some summary",
        attributes: sampleAttributes(),
      });

    expect(res.status).toBe(404);
  });

  it("should return 400 with invalid attributes", async () => {
    const res = await request(app)
      .post(`/api/v1/flows/model/${modelId}/dataflow/${dataFlowId}`)
      .set("Authorization", token)
      .send({
        originComponentId: randomUUID(),
        summary: "Some summary",
        attributes: { "invalid-key": "some value" },
      });

    expect(res.status).toBe(400);
  });
});

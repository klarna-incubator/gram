import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { randomUUID } from "crypto";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { sampleUser } from "../../../../test-util/sampleUser.js";
import Threat from "@gram/core/dist/data/threats/Threat.js";

const token = await sampleUserToken();

describe("Link.post", () => {
  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  const componentId = "fe93572e-9d0c-4afe-b042-e02c1c45f704";
  let modelId: string;
  let threatId: string;

  beforeAll(async () => {
    ({ pool, app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    // await _deleteAllTheThings(pool);
    const model = new Model(sampleOwnedSystem.id, "version", sampleUser.sub);
    model.data = { components: [], dataFlows: [] };
    modelId = await dal.modelService.create(model);
    threatId = await dal.threatService.create(
      new Threat("threat", "description", modelId, randomUUID(), sampleUser.sub)
    );
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).post(`/api/v1/links`).send({
      objectType: "threat",
      objectId: randomUUID(),
      label: "Threat",
      url: "something",
    });
    expect(res.status).toBe(401);
  });

  it("should return 200 without icon", async () => {
    const res = await request(app)
      .post(`/api/v1/links`)
      .set("Authorization", token)
      .send({
        objectType: "threat",
        objectId: threatId,
        label: "Some Link",
        url: "something",
      });

    expect(res.status).toBe(200);
  });

  it("should return 200 with icon", async () => {
    const res = await request(app)
      .post(`/api/v1/links`)
      .set("Authorization", token)
      .send({
        objectType: "threat",
        objectId: threatId,
        label: "Some Link",
        url: "something",
        icon: "jira",
      });

    expect(res.status).toBe(200);
  });

  it("should return 200 with model link", async () => {
    const res = await request(app)
      .post(`/api/v1/links`)
      .set("Authorization", token)
      .send({
        objectType: "model",
        objectId: modelId,
        label: "Some Link",
        url: "something",
      });

    expect(res.status).toBe(200);
  });

  it("should block javascript urls", async () => {
    const res = await request(app)
      .post(`/api/v1/links`)
      .set("Authorization", token)
      .send({
        objectType: "threat",
        objectId: randomUUID(),
        label: "Some Link",
        url: "javascript:alert(1)",
        icon: "jira",
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 with invalid threat id", async () => {
    const res = await request(app)
      .post(`/api/v1/links`)
      .set("Authorization", token)
      .send({
        objectType: "threat",
        objectId: randomUUID(),
        label: "Some Link",
        url: "something",
        icon: "jira",
      });

    expect(res.status).toBe(400);
  });
});

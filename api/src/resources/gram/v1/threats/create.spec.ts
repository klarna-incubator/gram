import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";
import { sampleUser } from "../../../../test-util/sampleUser.js";
import { jest } from "@jest/globals";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";

const token = await sampleUserToken();

describe("Threats.create", () => {
  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  const componentId = "fe93572e-9d0c-4afe-b042-e02c1c45f704";
  let modelId: string;

  beforeAll(async () => {
    ({ pool, app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    // await _deleteAllTheThings(pool);

    const model = new Model(sampleOwnedSystem.id, "version", sampleUser.sub);
    model.data = { components: [], dataFlows: [] };
    modelId = await dal.modelService.create(model);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app)
      .post(`/api/v1/models/${modelId}/threats`)
      .send({ title: "Threat", componentId });
    expect(res.status).toBe(401);
  });

  it("should return 200", async () => {
    const res = await request(app)
      .post(`/api/v1/models/${modelId}/threats`)
      .set("Authorization", token)
      .send({ title: "Threat", componentId, description: "something" });

    expect(res.status).toBe(200);
  });
});

import Control from "@gram/core/dist/data/controls/Control.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import Threat from "@gram/core/dist/data/threats/Threat.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";

describe("Mitigations.create", () => {
  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  const email = "test@abc.xyz";
  const componentId = "fe93572e-9d0c-4afe-b042-e02c1c45f704";
  let modelId: string;
  let threatId: string;
  let controlId: string;
  let token = "";

  beforeAll(async () => {
    token = await sampleUserToken();
    ({ pool, app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    const model = new Model(sampleOwnedSystem.id, "version", email);
    model.data = { components: [], dataFlows: [] };
    modelId = await dal.modelService.create(model);

    const threat = new Threat(
      "Threat",
      "threat description",
      modelId,
      componentId,
      email
    );
    threatId = await dal.threatService.create(threat);

    const control = new Control(
      "Control",
      "control description",
      false,
      modelId,
      componentId,
      email
    );
    controlId = await dal.controlService.create(control);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app)
      .post(`/api/v1/models/${modelId}/mitigations`)
      .send({ threatId: threatId, controlId: controlId });
    expect(res.status).toBe(401);
  });

  it("should return 200", async () => {
    const res = await request(app)
      .post(`/api/v1/models/${modelId}/mitigations`)
      .set("Authorization", token)
      .send({ threatId: threatId, controlId: controlId });
    expect(res.status).toBe(200);
  });

  afterAll(async () => {
    await _deleteAllTheThings(pool);
  });
});

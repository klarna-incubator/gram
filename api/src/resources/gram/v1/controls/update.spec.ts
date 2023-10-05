import { jest } from "@jest/globals";
import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import Control from "@gram/core/dist/data/controls/Control.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import Threat from "@gram/core/dist/data/threats/Threat.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";
import { sampleUser } from "../../../../test-util/sampleUser.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";

const token = await sampleUserToken();

describe("Controls.update", () => {
  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  const email = "test@abc.xyz";
  const componentId = "fe93572e-9d0c-4afe-b042-e02c1c45f704";
  let modelId: string;
  let threatId: string;
  let controlId: string;
  let control: Control;

  beforeAll(async () => {
    ({ app, dal, pool } = await createTestApp());
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

    control = new Control(
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
      .patch(`/api/v1/models/${modelId}/controls/${controlId}`)
      .send({ name: "Control" });
    expect(res.status).toBe(401);
  });

  it("should return 200 on updating name", async () => {
    const res = await request(app)
      .patch(`/api/v1/models/${modelId}/controls/${controlId}`)
      .set("Authorization", token)
      .send({ title: "Control 2" });

    expect(res.status).toBe(200);
    expect(res.body.result.title).toEqual("Control 2");
    expect(res.body.result.inPlace).toEqual(control.inPlace);
  });

  it("should return 200 on updating description and inPlace", async () => {
    const res = await request(app)
      .patch(`/api/v1/models/${modelId}/controls/${controlId}`)
      .set("Authorization", token)
      .send({ description: "control description...d", inPlace: true });

    expect(res.status).toBe(200);
    expect(res.body.result.description).toEqual("control description...d");
    expect(res.body.result.inPlace).toEqual(true);
  });

  it("should return 200 on inplace toggle", async () => {
    const res = await request(app)
      .patch(`/api/v1/models/${modelId}/controls/${controlId}`)
      .set("Authorization", token)
      .send({ inPlace: true });

    expect(res.status).toBe(200);
    expect(res.body.result.inPlace).toEqual(true);
    expect(res.body.result.title).toEqual(control.title);
  });

  it("should return 200 but not modify on invalid fields", async () => {
    const res = await request(app)
      .patch(`/api/v1/models/${modelId}/controls/${controlId}`)
      .set("Authorization", token)
      .send({ __proto__: "evil" });

    expect(res.status).toBe(200);
    expect(res.body.result).toEqual(false);
  });

  afterAll(async () => {
    await _deleteAllTheThings(pool);
  });
});

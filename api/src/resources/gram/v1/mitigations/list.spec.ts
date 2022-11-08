import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import Control from "../../../../data/controls/Control";
import { DataAccessLayer } from "../../../../data/dal";
import Mitigation from "../../../../data/mitigations/Mitigation";
import Model from "../../../../data/models/Model";
import { createPostgresPool } from "../../../../data/postgres";
import Threat from "../../../../data/threats/Threat";
import { _deleteAllTheThings } from "../../../../data/utils";
import { createTestApp } from "../../../../test-util/app";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem";
import { sampleUser } from "../../../../test-util/sampleUser";

describe("Controls.list", () => {
  const validate = jest.spyOn(jwt, "validateToken");

  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  const email = "test@abc.xyz";
  const componentId = "fe93572e-9d0c-4afe-b042-e02c1c45f704";
  let modelId: string;
  let threatId: string;
  let controlId: string;

  beforeAll(async () => {
    pool = await createPostgresPool();
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    validate.mockImplementation(async () => sampleUser);

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

    const mitigation = new Mitigation(threatId, controlId, email);
    await dal.mitigationService.create(mitigation);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get(`/api/v1/models/${modelId}/mitigations`);
    expect(res.status).toBe(401);
  });

  it("should return 200 and a list of controls", async () => {
    const res = await request(app)
      .get(`/api/v1/models/${modelId}/mitigations`)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.mitigations.length).toBe(1);
  });

  afterAll(async () => {
    validate.mockRestore();
    await _deleteAllTheThings(pool);
  });
});

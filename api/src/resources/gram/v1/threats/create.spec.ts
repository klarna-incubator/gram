import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import { DataAccessLayer } from "../../../../data/dal";
import Model from "../../../../data/models/Model";
import { _deleteAllTheThings } from "../../../../data/utils";
import { createTestApp } from "../../../../test-util/app";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem";
import { sampleUser } from "../../../../test-util/sampleUser";

describe("Threats.create", () => {
  const validate = jest.spyOn(jwt, "validateToken");

  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  const componentId = "fe93572e-9d0c-4afe-b042-e02c1c45f704";
  let modelId: string;

  beforeAll(async () => {
    ({ pool, app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    await _deleteAllTheThings(pool);

    validate.mockImplementation(async () => sampleUser);

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
      .set("Authorization", "bearer validToken")
      .send({ title: "Threat", componentId, description: "something" });

    expect(res.status).toBe(200);
  });

  afterAll(() => {
    validate.mockRestore();
  });
});

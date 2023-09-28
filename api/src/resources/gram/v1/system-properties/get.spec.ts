import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService.js";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";
import {
  sampleOtherUser,
  sampleUser,
} from "../../../../test-util/sampleUser.js";

describe("system-property.get", () => {
  let modelGetById: any;
  let modelService: ModelDataService;
  const validate = jest.spyOn(jwt, "validateToken");

  let app: any;

  beforeAll(async () => {
    ({
      app,
      dal: { modelService },
    } = await createTestApp());
    modelGetById = jest.spyOn(modelService, "getById");
  });

  beforeEach(() => {
    validate.mockImplementation(async () => sampleUser);

    modelGetById.mockImplementation(async () => {
      const model = new Model(sampleOwnedSystem.id, "Version 1", "root");
      model.id = "mod1";
      return model;
    });
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get(
      "/api/v1/system-properties/" + sampleOwnedSystem.id
    );
    expect(res.status).toBe(401);
  });

  it("should return 403 on unauthorized request (different team)", async () => {
    validate.mockImplementation(async () => sampleOtherUser);

    const res = await request(app)
      .post("/api/v1/models")
      .set("Authorization", "bearer validToken")
      .send({ version: "Some Model", systemId: sampleOwnedSystem.id });
    expect(res.status).toBe(403);
  });

  it("should return 404 on invalid model id", async () => {
    modelGetById.mockImplementation(async () => null);

    const res = await request(app)
      .get("/api/v1/system-properties/234")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(404);
  });

  it("should return 500 on error from getting model", async () => {
    modelGetById.mockImplementation(() => {
      throw new Error("Unknown");
    });

    const res = await request(app)
      .get("/api/v1/system-properties/" + sampleOwnedSystem.id)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(500);
  });

  afterAll(() => {
    validate.mockRestore();
    modelGetById.mockRestore();
  });
});

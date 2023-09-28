import Model from "@gram/core/dist/data/models/Model.js";
import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService.js";
import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { sampleUser } from "../../../../test-util/sampleUser.js";

describe("models.list", () => {
  let modelService: ModelDataService;
  let list: any;
  let app: any;
  let token = "";

  beforeAll(async () => {
    token = await sampleUserToken();
    ({
      app,
      dal: { modelService },
    } = await createTestApp());

    list = jest.spyOn(modelService, "list");
  });

  beforeEach(() => {
    list.mockImplementation(async () => {
      const modelA = new Model(sampleOwnedSystem.id, "Version 1", "root");
      modelA.id = "id1";
      const modelB = new Model(sampleOwnedSystem.id, "Version 2", "root");
      modelB.id = "id2";
      return [modelA, modelB];
    });
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/models");
    expect(res.status).toBe(401);
  });

  it("should return 400 with no filter query parameter", async () => {
    const res = await request(app)
      .get("/api/v1/models")
      .set("Authorization", token);

    expect(res.status).toBe(400);
  });

  it("should return 400 with invalid filter query parameter", async () => {
    const res = await request(app)
      .get("/api/v1/models?filter=123")
      .set("Authorization", token);

    expect(res.status).toBe(400);
  });

  it("should return 500 when list() returns unknown error", async () => {
    list.mockImplementation(() => {
      const error = new Error("Something messed up");
      error.name = "Some other error";
      throw error;
    });

    const res = await request(app)
      .get("/api/v1/models?filter=recent")
      .set("Authorization", token);

    expect(res.status).toBe(500);
  });

  it("should return 200 with dummy results", async () => {
    const res = await request(app)
      .get("/api/v1/models?filter=recent")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.models[0].id).toBe("id1");
    expect(res.body.models[0].systemId).toBe(sampleOwnedSystem.id);
    expect(res.body.models[0].version).toBe("Version 1");
    expect(res.body.models[0].createdBy).toBe("root");
  });

  afterAll(() => {
    list.mockRestore();
  });
});

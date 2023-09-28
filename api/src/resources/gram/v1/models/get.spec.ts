import { jest } from "@jest/globals";
import { randomUUID } from "crypto";
import { Express } from "express";
import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { genUser } from "@gram/core/dist/test-util/authz.js";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService.js";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";
import {
  sampleAdmin,
  sampleOtherUser,
  sampleUser,
} from "../../../../test-util/sampleUser.js";
import {
  sampleAdminToken,
  sampleOtherUserToken,
  sampleUserToken,
} from "../../../../test-util/sampleTokens.js";

describe("models.get", () => {
  let app: Express;
  let pool: any;
  let modelService: ModelDataService;

  let getById: any;
  let logAction: any;
  let token = "";

  afterAll(async () => await pool.end());

  beforeAll(async () => {
    token = await sampleUserToken();
    ({
      pool,
      app,
      dal: { modelService },
    } = await createTestApp());

    getById = jest.spyOn(modelService, "getById");
    logAction = jest.spyOn(modelService, "logAction");
  });

  beforeEach(async () => {
    logAction.mockImplementation(async () => {
      return;
    });
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get(
      "/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9"
    );
    expect(res.status).toBe(401);
  });

  it("should return 400 on invalid model id (not uuid)", async () => {
    const res = await request(app)
      .get("/api/v1/models/234")
      .set("Authorization", token);

    expect(res.status).toBe(400);
  });

  it("should return 200 on request from different team (read access ok)", async () => {
    const otherToken = await sampleOtherUserToken();

    getById.mockImplementation(async () => {
      const model = new Model(sampleOwnedSystem.id, "Gram", "root");
      model.id = "039cbb48-50ac-4b5a-abb0-018e50fb31c9";
      model.createdAt = Date.now();
      model.updatedAt = Date.now();
      return model;
    });

    const res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", otherToken);
    expect(res.status).toBe(200);
  });

  it("should return 200 on request from admin (read access ok)", async () => {
    const adminToken = await sampleAdminToken();

    getById.mockImplementation(async () => {
      const model = new Model(sampleOwnedSystem.id, "Gram", "root");
      model.id = "039cbb48-50ac-4b5a-abb0-018e50fb31c9";
      model.createdAt = Date.now();
      model.updatedAt = Date.now();
      return model;
    });

    const res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", adminToken);
    expect(res.status).toBe(200);
  });

  it("should return 404 on invalid model id (valid uuid)", async () => {
    getById.mockImplementation(async () => null);

    const res = await request(app)
      .get("/api/v1/models/" + randomUUID())
      .set("Authorization", token);

    expect(res.status).toBe(404);
  });

  it("should return 500 on unknown error from get()", async () => {
    getById.mockImplementation(() => {
      throw new Error("Unknown");
    });

    const res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", token);

    expect(res.status).toBe(500);
  });

  it("should return 200 with dummy data", async () => {
    getById.mockImplementation(async () => {
      const model = new Model(sampleOwnedSystem.id, "Gram", "root");
      model.id = "039cbb48-50ac-4b5a-abb0-018e50fb31c9";
      model.createdAt = Date.now();
      model.updatedAt = Date.now();
      return model;
    });

    const res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.model.id).toBe("039cbb48-50ac-4b5a-abb0-018e50fb31c9");
    expect(res.body.model.systemId).toBe(sampleOwnedSystem.id);
    expect(res.body.model.version).toBe("Gram");
    expect(res.body.model.data).toEqual({ components: [], dataFlows: [] });
    expect(res.body.model.createdBy).toBe("root");
    expect(res.body.model.createdAt).toBeDefined();
    expect(res.body.model.updatedAt).toBeDefined();
  });

  afterAll(() => {
    getById.mockRestore();
  });
});

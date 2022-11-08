import { randomUUID } from "crypto";
import { Express } from "express";
import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import { Role } from "../../../../auth/models/Role";
import Model from "../../../../data/models/Model";
import { ModelDataService } from "../../../../data/models/ModelDataService";
import { createTestApp } from "../../../../test-util/app";
import { genUser } from "../../../../test-util/authz";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem";
import {
  sampleAdmin,
  sampleOtherUser,
  sampleUser,
} from "../../../../test-util/sampleUser";

describe("models.get", () => {
  let app: Express;
  let pool: any;
  let modelService: ModelDataService;

  const validate = jest.spyOn(jwt, "validateToken");
  let getById: any;
  let logAction: any;

  afterAll(async () => await pool.end());

  beforeAll(async () => {
    ({
      pool,
      app,
      dal: { modelService },
    } = await createTestApp());

    getById = jest.spyOn(modelService, "getById");
    logAction = jest.spyOn(modelService, "logAction");
  });

  beforeEach(async () => {
    validate.mockImplementation(async () => sampleUser);
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
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(400);
  });

  it("should return 403 on unauthorized request (no role)", async () => {
    getById.mockImplementation(async () => {
      const model = new Model(sampleOwnedSystem.id, "Gram", "root");
      model.id = "039cbb48-50ac-4b5a-abb0-018e50fb31c9";
      model.createdAt = Date.now();
      model.updatedAt = Date.now();
      return model;
    });

    validate.mockImplementation(async () => {
      return {
        sub: "test@abc.xyz",
        roles: [], // No role
        teams: [{ name: "test team", id: "24" }],
        csrfToken: "whatever",
      };
    });

    const res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", "bearer validToken");
    expect(res.status).toBe(403);
  });

  it("should return 200 on request from different team (read access ok)", async () => {
    getById.mockImplementation(async () => {
      const model = new Model(sampleOwnedSystem.id, "Gram", "root");
      model.id = "039cbb48-50ac-4b5a-abb0-018e50fb31c9";
      model.createdAt = Date.now();
      model.updatedAt = Date.now();
      return model;
    });

    validate.mockImplementation(async () => sampleOtherUser);

    const res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", "bearer validToken");
    expect(res.status).toBe(200);
  });

  it("should return 200 on request from admin (read access ok)", async () => {
    getById.mockImplementation(async () => {
      const model = new Model(sampleOwnedSystem.id, "Gram", "root");
      model.id = "039cbb48-50ac-4b5a-abb0-018e50fb31c9";
      model.createdAt = Date.now();
      model.updatedAt = Date.now();
      return model;
    });

    validate.mockImplementation(async () => sampleAdmin);

    const res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", "bearer validToken");
    expect(res.status).toBe(200);
  });

  it("should return 200 on request from multi-role (read access ok)", async () => {
    getById.mockImplementation(async () => {
      const model = new Model(sampleOwnedSystem.id, "Gram", "root");
      model.id = "039cbb48-50ac-4b5a-abb0-018e50fb31c9";
      model.createdAt = Date.now();
      model.updatedAt = Date.now();
      return model;
    });

    validate.mockImplementation(async () =>
      genUser({
        roles: [Role.Admin, Role.Reviewer, Role.User],
      })
    );

    let res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", "bearer validToken");
    expect(res.status).toBe(200);

    // Different order
    validate.mockImplementation(async () =>
      genUser({
        roles: [Role.Reviewer, Role.User, Role.Admin],
      })
    );

    res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", "bearer validToken");
    expect(res.status).toBe(200);
  });

  it("should return 404 on invalid model id (valid uuid)", async () => {
    getById.mockImplementation(async () => null);

    const res = await request(app)
      .get("/api/v1/models/" + randomUUID())
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(404);
  });

  it("should return 500 on unknown error from get()", async () => {
    getById.mockImplementation(() => {
      throw new Error("Unknown");
    });

    const res = await request(app)
      .get("/api/v1/models/039cbb48-50ac-4b5a-abb0-018e50fb31c9")
      .set("Authorization", "bearer validToken");

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
      .set("Authorization", "bearer validToken");

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
    validate.mockRestore();
    getById.mockRestore();
  });
});

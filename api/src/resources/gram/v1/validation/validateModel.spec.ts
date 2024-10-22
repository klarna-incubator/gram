import request from "supertest";
import { jest } from "@jest/globals";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { createSampleModel } from "../../../../test-util/model.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { testValidationRules } from "../../../../test-util/testValidationRules.js";

describe("validateModel", () => {
  let app: any;
  let token: string;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
    token = await sampleUserToken();
  });
  beforeEach(() => {
    dal.validationEngine.register(testValidationRules);
  });

  afterEach(() => {
    dal.validationEngine.rules = [];
    jest.clearAllMocks();
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/validate/12323");
    expect(res.status).toBe(401);
  });
  it("should return 401 when using invalid user token", async () => {
    const res = await request(app)
      .get("/api/v1/validate/12323")
      .set("Authorization", "invalidtoken");
    expect(res.status).toBe(401);
  });

  it("should return 404 if no validation rules are available", async () => {
    dal.validationEngine.rules = [];
    const res = await request(app)
      .get("/api/v1/validate/")
      .set("Authorization", token);
    expect(res.status).toBe(404);
  });

  it("should return 404 if no rule applies to the model", async () => {
    const validModelId = await createSampleModel(dal);

    dal.validationEngine.rules = [
      {
        type: "component",
        name: "should have a name",
        affectedType: ["proc", "ee", "ds", "tb"],
        test: async ({ component }) => component.name.trim() !== "",
        messageTrue: "Component has a name",
        messageFalse: "Component does not have a name",
      },
    ];

    const res = await request(app)
      .get("/api/v1/validate/" + validModelId)
      .set("Authorization", token);
    expect(res.status).toBe(404);
  });

  it("should return 500 if the model id is invalid or unknown", async () => {
    const invalidmodelId = "12323";
    const res = await request(app)
      .get("/api/v1/validate/" + invalidmodelId)
      .set("Authorization", token);
    expect(res.status).toBe(500);
  });

  it("should return 200 if the model id is valid", async () => {
    const validModelId = await createSampleModel(dal);

    const res = await request(app)
      .get("/api/v1/validate/" + validModelId)
      .set("Authorization", token);
    expect(res.status).toBe(200);
  });

  it("should return a list of validation results with metadata", async () => {
    const validModelId = await createSampleModel(dal, "root", {
      components: [
        {
          x: 222,
          y: 350,
          id: "5e8e6021-9455-4157-a026-c7be218b1019",
          name: "Process",
          type: "proc",
        },
      ],
      dataFlows: [],
    });

    const res = await request(app)
      .get("/api/v1/validate/" + validModelId)
      .set("Authorization", token);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(validModelId);
    expect(res.body.total).toBe(res.body.results.length);
    expect(Array.isArray(res.body.results)).toBeTruthy();
  });
});

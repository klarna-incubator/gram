import request from "supertest";
import { jest } from "@jest/globals";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { createSampleModel } from "../../../../test-util/model.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import {
  ValidationProvider,
  ValidationResult,
} from "@gram/core/dist/validation/ValidationHandler.js";
import { log } from "console";

describe("validateModel", () => {
  let app: any;
  let token: string;
  let getById: any;
  let modelService: ModelDataService;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
    token = await sampleUserToken();
    modelService = dal.modelService;
    getById = jest.spyOn(modelService, "getById");
  });

  it("should register StaticValidationHandler", () => {
    const validationProviderList = dal.validationHandler.validationProviders;
    expect(validationProviderList.length).toBeGreaterThan(0);
    expect(
      validationProviderList.find((element: ValidationProvider) => {
        return element.name === "StaticValidationProvider";
      })
    ).toBeTruthy();
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
  it("should return 500 if the model id is invalid or unknown", async () => {
    const invalidmodelId = "12323";
    const res = await request(app)
      .get("/api/v1/validate/" + invalidmodelId)
      .set("Authorization", token);
    expect(res.status).toBe(500);
  });

  it("should return 200 if the model id is valid", async () => {
    const validModelId = await createSampleModel(dal);

    getById.mockImplementation(async () => {
      const model = new Model(validModelId, "some-version", "some-owner");
      return model;
    });

    const res = await request(app)
      .get("/api/v1/validate/" + validModelId)
      .set("Authorization", token);
    expect(res.status).toBe(200);
  });

  it("should return a list of validation results", async () => {
    const validModelId = "1daf8acc-a691-408d-802c-46e360d2f427";
    getById.mockImplementation(async () => {
      const model = new Model("some-system-id", "some-version", "some-owner");
      model.id = validModelId;
      model.data = {
        dataFlows: [],
        components: [
          {
            x: 222,
            y: 350,
            id: "5e8e6021-9455-4157-a026-c7be218b1019",
            name: "Process",
            type: "proc",
          },
        ],
      };
      return model;
    });

    const res = await request(app)
      .get("/api/v1/validate/" + validModelId)
      .set("Authorization", token);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(validModelId);
    expect(res.body.total).toBe(res.body.results.length);
    expect(res.body.results).toBeDefined();

    // expect (res.body.data)
  });

  it("should return a list of model validation results only if model is empty", async () => {
    const validModelId = "1daf8acc-a691-408d-802c-46e360d2f427";
    getById.mockImplementation(async () => {
      const model = new Model("some-system-id", "some-version", "some-owner");
      model.id = validModelId;
      model.data = {
        dataFlows: [],
        components: [],
      };
      return model;
    });

    const res = await request(app)
      .get("/api/v1/validate/" + validModelId)
      .set("Authorization", token);
    console.log("body", res.body.results);

    const results = res.body.results;

    expect(res.status).toBe(200);
    expect(results.length).not.toBe(0);
    expect(res.body.id).toBe(validModelId);
    expect(res.body.total).toBe(results.length);
    expect(Array.isArray(results)).toBeTruthy();

    expect(
      results.every((element: ValidationResult) => element.type === "model")
    ).toBeTruthy();
    expect(
      results.some((element: ValidationResult) => element.type === "component")
    ).toBeFalsy();
  });

  it("should return a list of component and model validation results if model has components", async () => {
    const validModelId = "1daf8acc-a691-408d-802c-46e360d2f427";
    getById.mockImplementation(async () => {
      const model = new Model("some-system-id", "some-version", "some-owner");
      model.id = validModelId;
      model.data = {
        dataFlows: [],
        components: [
          {
            x: 222,
            y: 350,
            id: "5e8e6021-9455-4157-a026-c7be218b1019",
            name: "Process",
            type: "proc",
          },
          {
            x: 222,
            y: 350,
            id: "5e8e7021-9455-4157-z026-c7be218b1019",
            name: "Process",
            type: "proc",
          },
        ],
      };
      return model;
    });

    const res = await request(app)
      .get("/api/v1/validate/" + validModelId)
      .set("Authorization", token);
    const results = res.body.results;

    expect(res.status).toBe(200);
    expect(results.length).not.toBe(0);
    expect(res.body.id).toBe(validModelId);
    expect(res.body.total).toBe(results.length);
    expect(Array.isArray(results)).toBeTruthy();

    expect(
      results.some(
        (element: ValidationResult) =>
          element.type === "component" &&
          element.elementId === "5e8e6021-9455-4157-a026-c7be218b1019"
      )
    ).toBeTruthy();

    expect(
      results.some(
        (element: ValidationResult) =>
          element.type === "component" &&
          element.elementId === "5e8e7021-9455-4157-z026-c7be218b1019"
      )
    ).toBeTruthy();

    expect(
      results.some((element: ValidationResult) => element.type === "model")
    ).toBeTruthy();
  });
});

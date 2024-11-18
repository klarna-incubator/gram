import Model from "@gram/core/dist/data/models/Model.js";
import { DataAccessLayer } from "../data/dal.js";
import { createPostgresPool } from "../data/postgres.js";
import { ValidationEngine } from "./engine.js";
import { testValidationRules } from "../test-util/testValidationRules.js";
import { createSampleModel } from "../test-util/model.js";

describe("ValidationEngine", () => {
  let dal: DataAccessLayer;
  let validationEngine: ValidationEngine;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    validationEngine = new ValidationEngine(dal, true);
  });

  afterEach(async () => {
    validationEngine.rules = [];
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  it("getResults should return empty array if engine has no rule", async () => {
    expect(validationEngine.rules.length).toBe(0);
    const modelId = await createSampleModel(dal);
    const resultList = await validationEngine.getResults(modelId);
    expect(resultList.length).toBe(0);
  });

  it("getResults should return an array", async () => {
    validationEngine.register(testValidationRules);
    const modelId = await createSampleModel(dal);
    const result = await validationEngine.getResults(modelId);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getResults should return rule result for model", async () => {
    validationEngine.register([
      {
        type: "model",
        name: "should have at least one component",
        affectedType: [],
        test: async ({ model }) => model.data.components.length > 0,
        messageTrue: "Model has at least one component",
        messageFalse: "Model is empty",
      },
    ]);
    const modelId = await createSampleModel(dal);
    const resultList = await validationEngine.getResults(modelId);

    expect(resultList.length).toBe(1);
    const result = resultList[0];
    expect(result.type).toBe("model");
    expect(result.ruleName).toBe("should have at least one component");
  });

  it("getResults should return results for each components", async () => {
    validationEngine.register(testValidationRules);
    const modelId = await createSampleModel(dal);

    const resultList = await validationEngine.getResults(modelId);
    const componentResults = resultList.filter(
      (result) => result.type === "component"
    );
    expect(componentResults.length).toBe(2 * 2); // Number of component rules * number of components
  });

  it("should handle rules that error", async () => {
    validationEngine.register([
      ...testValidationRules,
      {
        type: "component",
        name: "should crash",
        affectedType: ["proc", "ee", "ds", "tb"],
        test: async ({ component }) => {
          throw new Error("Kaboom!");
        },
        messageTrue: "should never be true",
        messageFalse: "Yep, it crashed",
      },
    ]);
    const modelId = await createSampleModel(dal);
    const resultList = await validationEngine.getResults(modelId);
    const errorResult = resultList.find(
      (result) => result.ruleName === "should crash"
    );
    expect(errorResult).toBeUndefined();

    expect(Array.isArray(resultList)).toBe(true);
  });

  it("should select rules that have no conditions", async () => {
    validationEngine.register([
      {
        type: "model",
        name: "should have at least one component",
        affectedType: [],
        test: async ({ model }) => model.data.components.length > 0,
        messageTrue: "Model has at least one component",
        messageFalse: "Model is empty",
      },
      {
        type: "model",
        name: "should have at least one component",
        conditionalRules: [],
        affectedType: [],
        test: async ({ model }) => model.data.components.length > 0,
        messageTrue: "Model has at least one component",
        messageFalse: "Model is empty",
      },
    ]);
    const modelId = await createSampleModel(dal);
    const resultList = await validationEngine.getResults(modelId);
    expect(resultList.length).toBe(2);
  });

  it("should select appropriate rules based on conditions", async () => {
    validationEngine.register([
      {
        type: "model",
        name: "should be selected",
        conditionalRules: [async (args) => true],
        affectedType: [],
        test: async ({ model }) => model.data.components.length > 0,
        messageTrue: "Model has at least one component",
        messageFalse: "Model is empty",
      },
      {
        type: "model",
        name: "should not be selected",
        conditionalRules: [async (args) => false, async (args) => true],
        affectedType: [],
        test: async ({ model }) => model.data.components.length > 0,
        messageTrue: "Model has at least one component",
        messageFalse: "Model is empty",
      },
    ]);
    const modelId = await createSampleModel(dal);
    const resultList = await validationEngine.getResults(modelId);
    expect(resultList.length).toBe(1);
    expect(resultList[0].ruleName).toBe("should be selected");
  });
});

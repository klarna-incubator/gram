import Model from "@gram/core/dist/data/models/Model.js";
import { DataAccessLayer } from "../data/dal.js";
import { createPostgresPool } from "../data/postgres.js";
import { ValidationEngine } from "./engine.js";

describe("StaticValidationProvider", () => {
  let dal: DataAccessLayer;
  let validationEngine: ValidationEngine;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    validationEngine = new ValidationEngine(dal);
    console.log("validationEngine", validationEngine.rules);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  it("should return an array", async () => {
    const model = new Model("some-system-id", "some-version", "some-owner");
    model.id = "some-id";
    const result = await validationEngine.validate(model.id);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return one result for an empty model", async () => {
    const model = new Model("some-system-id", "some-version", "some-owner");
    model.id = "some-id";
    const resultList = await validationEngine.validate(model.id);
    expect(resultList.length).toBe(1);
    const result = resultList[0];
    expect(result.type).toBe("model");
    expect(result.ruleName).toBe("should have at least one component");
    expect(result.testResult).toBe(false);
    expect(result.message).toBe("Model is empty");
  });

  it("should have validation results for each component", async () => {
    const model = new Model("some-system-id", "some-version", "some-owner");
    model.id = "some-id";
    model.data = {
      dataFlows: [],
      components: [
        {
          x: 338.046875,
          y: 450,
          id: "e8edd886-84fa-4c2b-aef9-b2724eab08c8",
          name: "Process",
          type: "proc",
        },
        {
          x: 736.046875,
          y: 299,
          id: "b66e03fd-36dc-4813-9d6b-2af4eb35a66e",
          name: "External entity",
          type: "ee",
        },
        {
          x: 755.046875,
          y: 613,
          id: "e7bdc6a9-169a-40fc-8831-543db611ff6a",
          name: "Data Store",
          type: "ds",
        },
        {
          x: 383.046875,
          y: 804,
          id: "1645da1a-142b-4567-a2af-1e6ea76181b0",
          name: "Trust Boundary",
          type: "tb",
          width: 300,
          height: 150,
        },
      ],
    };

    const resultList = await validationEngine.validate(model.id);
    expect(resultList.length).toBeGreaterThan(4);
    expect(
      resultList.some(
        (result) =>
          result.type === "component" &&
          result.elementId === "e8edd886-84fa-4c2b-aef9-b2724eab08c8"
      )
    ).toBe(true);
    expect(
      resultList.some(
        (result) =>
          result.type === "component" &&
          result.elementId === "b66e03fd-36dc-4813-9d6b-2af4eb35a66e"
      )
    ).toBe(true);
    expect(
      resultList.some(
        (result) =>
          result.type === "component" &&
          result.elementId === "e7bdc6a9-169a-40fc-8831-543db611ff6a"
      )
    ).toBe(true);
    expect(
      resultList.some(
        (result) =>
          result.type === "component" &&
          result.elementId === "1645da1a-142b-4567-a2af-1e6ea76181b0"
      )
    ).toBe(true);
  });
});

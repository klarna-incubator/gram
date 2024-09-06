import Model from "@gram/core/dist/data/models/Model.js";
import { StaticValidationProvider } from "./StaticValidationProvider.js";
import { ValidationProvider } from "@gram/core/dist/validation/ValidationHandler.js";
describe("StaticValidationProvider", () => {
  let staticValidationProvider: ValidationProvider;

  beforeAll(async () => {
    staticValidationProvider = new StaticValidationProvider();
  });

  it("should return an array", async () => {
    const model = new Model("some-system-id", "some-version", "some-owner");
    const result = await staticValidationProvider.validate(model);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return one result for an empty model", async () => {
    const model = new Model("some-system-id", "some-version", "some-owner");
    const resultList = await staticValidationProvider.validate(model);
    expect(resultList.length).toBe(1);
    const result = resultList[0];
    expect(result.type).toBe("model");
    expect(result.ruleName).toBe("should have at least one component");
    expect(result.testResult).toBe(false);
    expect(result.message).toBe("Model is empty");
  });

  it("should have validation results for each component", async () => {
    const model = new Model("some-system-id", "some-version", "some-owner");
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

    const resultList = await staticValidationProvider.validate(model);
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

  describe("StaticValidationProvider: validation rules", () => {
    it("should have all testResult true for a valid component", async () => {
      const model = new Model("some-system-id", "some-version", "some-owner");
      model.data = {
        dataFlows: [
          {
            id: "6092a7a7-4693-4352-9229-68793464fde4",
            points: [338.046875, 450, 651.046875, 655],
            endComponent: {
              id: "b66e03fd-36dc-4813-9d6b-2af4eb35a66e",
            },
            startComponent: {
              id: "e8edd886-84fa-4c2b-aef9-b2724eab08c8",
            },
            bidirectional: false,
          },
        ],
        components: [
          {
            x: 338.046875,
            y: 450,
            id: "e8edd886-84fa-4c2b-aef9-b2724eab08c8",
            name: "Process",
            type: "proc",
            classes: [
              {
                id: "bb3a425c-f89c-4b2e-a375-5437e1140b89",
                icon: "/assets/klarna/klarna.png",
                name: "Klarna",
                componentType: "any",
              },
            ],
            description:
              "This is an amazing description, it describes the process in detail and why it is important",
          },
          {
            x: 649.046875,
            y: 598,
            id: "b66e03fd-36dc-4813-9d6b-2af4eb35a66e",
            name: "External entity",
            type: "ee",
          },
        ],
      };

      const resultList = await staticValidationProvider.validate(model);
      const validComponentResults = resultList.filter(
        (result) => result.elementId === "e8edd886-84fa-4c2b-aef9-b2724eab08c8"
      );

      expect(
        validComponentResults.every((result) => result.testResult === true)
      ).toBe(true);
    });

    it("should have all testResult false for invalid component", async () => {
      const model = new Model("some-system-id", "some-version", "some-owner");
      model.data = {
        dataFlows: [],
        components: [
          {
            x: 649.046875,
            y: 598,
            id: "b66e03fd-36dc-4813-9d6b-2af4eb35a66e",
            name: "",
            type: "ee",
          },
        ],
      };
      const result = await staticValidationProvider.validate(model);
      const invalidComponentResults = result.filter(
        (result) => result.elementId === "b66e03fd-36dc-4813-9d6b-2af4eb35a66e"
      );
      expect(
        invalidComponentResults.every((result) => result.testResult === false)
      ).toBe(true);
    });
  });
});

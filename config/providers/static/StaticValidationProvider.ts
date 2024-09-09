import Model from "@gram/core/dist/data/models/Model.js";
import {
  ComponentValidationRule,
  ModelValidationRule,
  ValidationProvider,
  ValidationResult,
  ValidationRule,
} from "@gram/core/dist/validation/ValidationHandler.js";

const validationRules: ValidationRule[] = [
  {
    type: "component",
    name: "should have a name",
    affectedType: ["proc", "ee", "ds", "tf"],
    test: (component, _) => component.name.trim() !== "",
    messageTrue: "Component has a name",
    messageFalse: "Component does not have a name",
  },
  {
    type: "component",
    name: "should have a description",
    affectedType: ["proc", "ee", "ds", "tf"],
    test: (component, _) =>
      component.description ? component.description.trim() !== "" : false,
    messageTrue: "Component has a description",
    messageFalse: "Component does not have a description",
  },
  {
    type: "component",
    name: "should have a long enough description",
    affectedType: ["proc", "ee", "ds", "tf"],
    conditionalRules: [["should have a description", true]],
    test: (component, _) =>
      component.description ? component.description.length > 50 : false,
    messageTrue: "Component has a long enough description",
    messageFalse:
      "Component's description should be at least 50, to be descriptive enough",
  },
  {
    type: "component",
    name: "should have at least one tech stack",
    affectedType: ["proc", "ds", "tf"],
    test: (component, _) =>
      component.classes ? component.classes.length > 0 : false,
    messageTrue: "Component has at least one tech stack",
    messageFalse: "Component does not have any tech stack",
  },
  {
    type: "component",
    name: "should have at least one dataflow",
    affectedType: ["proc", "ds", "tf", "ee"],
    test: (component, dataflows) => {
      if (dataflows.length === 0) {
        return false;
      }
      return dataflows.some(
        (dataflow) =>
          dataflow.endComponent.id === component.id ||
          dataflow.startComponent.id === component.id
      );
    },
    messageTrue: "Component has at least one dataflow",
    messageFalse: "Component does not have any dataflow",
  },
  {
    type: "model",
    name: "should have at least one component",
    affectedType: [],
    test: (model) => model.data.components.length > 0,
    messageTrue: "Model has at least one component",
    messageFalse: "Model is empty",
  },
];

function isComponentValidation(
  rule: ValidationRule
): rule is ComponentValidationRule {
  return rule.type === "component";
}

function isModelValidation(rule: ValidationRule): rule is ModelValidationRule {
  return rule.type === "model";
}
export class StaticValidationProvider implements ValidationProvider {
  name: string = "StaticValidationProvider";
  async validate(model: Model): Promise<ValidationResult[]> {
    if (!model) {
      return [
        {
          type: "model",
          ruleName: "should have at least one component",
          testResult: false,
          message: "Model is empty",
        },
      ];
    }

    const components = model.data.components;
    const dataFlows = model.data.dataFlows;
    const componentRules = validationRules.filter(
      (rule) => rule.type === "component"
    );
    const modelRules = validationRules.filter((rule) => rule.type === "model");
    const results: ValidationResult[] = [];

    // Validate components

    for (const component of components) {
      for (const rule of componentRules) {
        if (!isComponentValidation(rule)) {
          continue;
        }
        const testResult = rule.test(component, dataFlows);
        results.push({
          type: rule.type,
          elementId: component.id,
          ruleName: rule.name,
          testResult: testResult,
          message: testResult ? rule.messageTrue : rule.messageFalse,
        });
      }
    }

    for (const rule of modelRules) {
      if (!isModelValidation(rule)) {
        continue;
      }
      const testResult = rule.test(model);
      results.push({
        type: rule.type,
        ruleName: rule.name,
        testResult: testResult,
        message: testResult ? rule.messageTrue : rule.messageFalse,
      });
    }
    return results;
  }
}

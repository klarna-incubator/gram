import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
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
    affectedType: ["proc", "ee", "ds", "tb"],
    test: async ({ component }) => component.name.trim() !== "",
    messageTrue: "Component has a name",
    messageFalse: "Component does not have a name",
  },
  {
    type: "component",
    name: "should have a description",
    affectedType: ["proc", "ee", "ds", "tb"],
    test: async ({ component }) =>
      component.description ? component.description.trim() !== "" : false,
    messageTrue: "Component has a description",
    messageFalse: "Component does not have a description",
  },
  {
    type: "component",
    name: "should have a long enough description",
    affectedType: ["proc", "ee", "ds", "tb"],
    conditionalRules: [["should have a description", true]],
    test: async ({ component }) =>
      component.description ? component.description.length > 50 : false,
    messageTrue: "Component has a long enough description",
    messageFalse:
      "Component's description should be at least 50, to be descriptive enough",
  },
  {
    type: "component",
    name: "should have at least one tech stack",
    affectedType: ["proc", "ds", "tb"],
    test: async ({ component }) =>
      component.classes ? component.classes.length > 0 : false,
    messageTrue: "Component has at least one tech stack",
    messageFalse: "Component does not have any tech stack",
  },
  {
    type: "component",
    name: "should have at least one dataflow",
    affectedType: ["proc", "ds", "ee"],
    test: async ({ component, dataflows }) => {
      if (!dataflows) {
        return false;
      }
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
    type: "component",
    name: "should have at least one threat",
    affectedType: ["proc", "ds", "tb"],
    test: async ({ component, threats }) =>
      threats
        ? threats.some((threat) => threat.componentId === component.id)
        : false,
    messageTrue: "Component has at least one threat",
    messageFalse: "Component does not have any threats",
  },
  {
    type: "component",
    name: "should have at least one control",
    affectedType: ["proc", "ds", "tb"],
    test: async ({ component, controls }) =>
      controls
        ? controls.some((control) => control.componentId === component.id)
        : false,
    messageTrue: "Component has at least one threat",
    messageFalse: "Component does not have any threats",
  },
  {
    type: "model",
    name: "should have at least one component",
    affectedType: [],
    test: async ({ model }) => model.data.components.length > 0,
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
  constructor(public dal: DataAccessLayer) {}

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

    // Model's data
    const components = model.data.components;
    const dataFlows = model.data.dataFlows;
    const threats = model?.id
      ? await this.dal.threatService.list(model.id)
      : [];
    const controls = model?.id
      ? await this.dal.controlService.list(model.id)
      : [];
    const mitigations = model?.id
      ? await this.dal.mitigationService.list(model.id)
      : [];

    // Rules
    const componentRules = validationRules.filter(
      (rule) => rule.type === "component"
    );
    const modelRules = validationRules.filter((rule) => rule.type === "model");
    const results: ValidationResult[] = [];

    // Validate model
    for (const rule of modelRules) {
      if (!isModelValidation(rule)) {
        continue;
      }
      const testResult = await rule.test({ model });
      results.push({
        type: rule.type,
        elementName: "Model",
        ruleName: rule.name,
        testResult: testResult,
        message: testResult ? rule.messageTrue : rule.messageFalse,
      });
    }

    // Validate components
    for (const component of components) {
      for (const rule of componentRules) {
        if (!isComponentValidation(rule)) {
          continue;
        }
        if (!rule.affectedType.includes(component.type)) {
          continue;
        }
        const testResult = await rule.test({
          component,
          dataflows: dataFlows,
          threats,
          controls,
          mitigations,
        });
        results.push({
          type: rule.type,
          elementId: component.id,
          elementName: component.name,
          ruleName: rule.name,
          testResult: testResult,
          message: testResult ? rule.messageTrue : rule.messageFalse,
        });
      }
    }

    return results;
  }
}

import Model, { Component, DataFlow } from "../data/models/Model.js";

export interface ValidationResult {
  type: "component" | "resource" | "model";
  elementId?: string;
  ruleName: string;
  testResult: boolean;
  message: string;
}

export interface ValidationProvider {
  validate(model: Model): Promise<ValidationResult[]>;
}

export interface ComponentValidationRule {
  type: "component";
  name: string;
  affectedType: ("proc" | "ee" | "ds" | "tf")[];
  conditionalRules?: [string, boolean][]; // ["name of the rule", "result of the test"]
  test: (component: Component, dataflows: DataFlow[]) => boolean; // Return true if the model follows the rules
  messageTrue: string;
  messageFalse: string;
}

export interface ModelValidationRule {
  type: "model";
  name: string;
  affectedType: [];
  conditionalRules?: [string, boolean][]; // ["name of the rule", "result of the test"]
  test: (model: Model) => boolean; // Return true if the model follows the rules
  messageTrue: string;
  messageFalse: string;
}

export type ValidationRule = ComponentValidationRule | ModelValidationRule;

export class ValidationHandler {
  validationProviders: ValidationProvider[];

  constructor() {
    this.validationProviders = [];
  }

  register(provider: ValidationProvider): void {
    this.validationProviders.push(provider);
  }

  async validate(model: Model): Promise<ValidationResult[]> {
    return [
      ...(await Promise.all(
        this.validationProviders.map(
          async (provider): Promise<ValidationResult[]> => ({
            ...(await provider.validate(model)),
          })
        )
      )),
    ].flat();
  }
}

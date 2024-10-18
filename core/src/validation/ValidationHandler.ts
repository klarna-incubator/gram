import Control from "../data/controls/Control.js";
import Mitigation from "../data/mitigations/Mitigation.js";
import Model, { Component, DataFlow } from "../data/models/Model.js";
import Threat from "../data/threats/Threat.js";

export interface ValidationResult {
  type: "component" | "resource" | "model";
  elementId?: string;
  elementName?: string;
  ruleName: string;
  testResult: boolean;
  message: string;
}

export interface ValidationProvider {
  name: string;
  validate(model: Model): Promise<ValidationResult[]>;
}

export interface ModelTestRuleArgs {
  model: Model;
}
export interface ComponentTestRuleArgs {
  component: Component;
  dataflows?: DataFlow[];
  threats?: Threat[];
  controls?: Control[];
  mitigations?: Mitigation[];
}

export interface ComponentValidationRule {
  type: "component";
  name: string;
  affectedType: ("proc" | "ee" | "ds" | "tb")[];
  conditionalRules?: [string, boolean][]; // ["name of the rule", "result of the test"]
  test: (args: ComponentTestRuleArgs) => Promise<boolean>; // Return true if the model follows the rules
  messageTrue: string;
  messageFalse: string;
}

export interface ModelValidationRule {
  type: "model";
  name: string;
  affectedType: [];
  conditionalRules?: [string, boolean][]; // ["name of the rule", "result of the test"]
  test: (args: ModelTestRuleArgs) => Promise<boolean>; // Return true if the model follows the rules
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
          async (provider): Promise<ValidationResult[]> => [
            ...(await provider.validate(model)),
          ]
        )
      )),
    ].flat();
  }
}

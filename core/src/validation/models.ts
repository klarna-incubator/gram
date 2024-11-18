import Control from "../data/controls/Control.js";
import Mitigation from "../data/mitigations/Mitigation.js";
import Model, { Component, DataFlow } from "../data/models/Model.js";
import {
  SuggestedControl,
  SuggestedThreat,
} from "../data/suggestions/Suggestion.js";
import Threat from "../data/threats/Threat.js";

export interface ValidationResult {
  type: "component" | "resource" | "model";
  elementId?: string;
  elementName?: string;
  ruleName: string;
  testResult: boolean;
  message: string;
}

export interface ModelTestRuleArgs {
  model: Model;
  threats?: Threat[];
  controls?: Control[];
  mitigations?: Mitigation[];
  threatSuggestions?: SuggestedThreat[];
  controlSuggestions?: SuggestedControl[];
}
export interface ComponentTestRuleArgs extends ModelTestRuleArgs {
  component: Component;
  dataflows?: DataFlow[];
}

export type conditionalRule = (args: ModelTestRuleArgs) => Promise<boolean>;

export interface ComponentValidationRule {
  type: "component";
  name: string;
  affectedType: ("proc" | "ee" | "ds" | "tb")[];
  conditionalRules?: conditionalRule[]; // Rule is skippped if the conditions are not met
  test: (args: ComponentTestRuleArgs) => Promise<boolean>; // Return true if the model follows the rules
  messageTrue: string;
  messageFalse: string;
}

export interface ModelValidationRule {
  type: "model";
  name: string;
  affectedType: [];
  conditionalRules?: conditionalRule[]; // Rule is skippped if the conditions are not met
  test: (args: ModelTestRuleArgs) => Promise<boolean>; // Return true if the model follows the rules
  messageTrue: string;
  messageFalse: string;
}

export type ValidationRule = ComponentValidationRule | ModelValidationRule;

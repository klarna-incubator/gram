import { DataAccessLayer } from "../data/dal.js";

import log4js from "log4js";
import {
  ComponentValidationRule,
  ModelValidationRule,
  ValidationResult,
  ValidationRule,
} from "./models.js";

const VALIDATION_DELAY =
  process.env.NODE_ENV && process.env.NODE_ENV === "test" ? 0 : 3000;

function isComponentValidation(
  rule: ValidationRule
): rule is ComponentValidationRule {
  return rule.type === "component";
}

function isModelValidation(rule: ValidationRule): rule is ModelValidationRule {
  return rule.type === "model";
}

export class ValidationEngine {
  public rules: ValidationRule[] = [];

  log = log4js.getLogger("ValidationEngine");

  // One timeout per ModelID: should be threadsafe because node runs singlethreaded ;))
  delayer = new Map<string, NodeJS.Timeout>();

  constructor(private dal: DataAccessLayer, public noListen: boolean = false) {
    dal.modelService.on("updated-for", ({ modelId }) => {
      if (!this.noListen) {
        this.log.debug(`model ${modelId} was updated via api`);
        // Trigger a fetch of suggestions after a delay. New activity resets the timer to avoid trigger multiple times.
        const timeout = this.delayer.get(modelId);
        if (timeout) clearTimeout(timeout);
        this.delayer.set(
          modelId,
          setTimeout(() => this.validate(modelId), VALIDATION_DELAY)
        );
      }
    });
  }

  register(rules: ValidationRule[]) {
    this.rules.push(...rules);
  }

  async validate(modelId: string): Promise<ValidationResult[]> {
    const model = await this.dal.modelService.getById(modelId);

    if (!model) {
      this.log.warn(
        `Validation was requested for ${modelId}, which does not exist`
      );
      return [];
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
    const componentRules = this.rules.filter(
      (rule) => rule.type === "component"
    );
    const modelRules = this.rules.filter((rule) => rule.type === "model");
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

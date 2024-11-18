import { DataAccessLayer } from "../data/dal.js";

import log4js from "log4js";
import {
  ComponentValidationRule,
  ModelValidationRule,
  ValidationResult,
  ValidationRule,
} from "./models.js";
import Cache from "../util/cache.js";
import EventEmitter from "events";

const VALIDATION_DELAY =
  process.env.NODE_ENV && process.env.NODE_ENV === "test" ? 0 : 1500;

function isComponentValidation(
  rule: ValidationRule
): rule is ComponentValidationRule {
  return rule.type === "component";
}

function isModelValidation(rule: ValidationRule): rule is ModelValidationRule {
  return rule.type === "model";
}

const CACHE_EXPIRY_INTERVAL_MS = 1000 * 60 * 60 * 24; // 24 hours

export class ValidationEngine extends EventEmitter {
  public rules: ValidationRule[] = [];

  log = log4js.getLogger("ValidationEngine");

  // One timeout per ModelID: should be threadsafe because node runs singlethreaded ;))
  delayer = new Map<string, NodeJS.Timeout>();

  cache = new Cache<string, ValidationResult[]>(
    "ValidationEngine",
    CACHE_EXPIRY_INTERVAL_MS
  );

  constructor(private dal: DataAccessLayer, public noListen: boolean = false) {
    super();

    if (!noListen) {
      dal.modelService.on("updated-for", ({ modelId }) => {
        this.queueValidation(modelId);
      });

      dal.threatService.on("updated-for", ({ modelId }) => {
        this.queueValidation(modelId);
      });
      dal.threatService.on("deleted-for", ({ modelId }) => {
        this.queueValidation(modelId);
      });

      dal.controlService.on("updated-for", ({ modelId }) => {
        this.queueValidation(modelId);
      });
      dal.controlService.on("deleted-for", ({ modelId }) => {
        this.queueValidation(modelId);
      });

      dal.suggestionService.on("updated-for", ({ modelId }) => {
        this.queueValidation(modelId);
      });

      dal.mitigationService.on("updated-for", ({ modelId }) => {
        this.queueValidation(modelId);
      });
    }
  }

  private queueValidation(modelId: any) {
    this.log.debug(`model ${modelId} was updated via api`);
    // Trigger a fetch of suggestions after a delay. New activity resets the timer to avoid trigger multiple times.
    const timeout = this.delayer.get(modelId);
    if (timeout) clearTimeout(timeout);
    this.delayer.set(
      modelId,
      setTimeout(() => this.validate(modelId), VALIDATION_DELAY)
    );
  }

  register(rules: ValidationRule[]) {
    this.rules.push(...rules);
  }

  async validate(modelId: string) {
    this.log.debug(`Validating model ${modelId}`);
    const model = await this.dal.modelService.getById(modelId);

    if (!model) {
      this.log.warn(
        `Validation was requested for ${modelId}, which does not exist`
      );
      return;
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

    const threatSuggestions = model?.id
      ? await this.dal.suggestionService.listThreatSuggestions(model.id)
      : [];
    const controlSuggestions = model?.id
      ? await this.dal.suggestionService.listControlSuggestions(model.id)
      : [];

    // Rules
    const componentRules = this.rules.filter(
      (rule) => rule.type === "component"
    );
    const modelRules = this.rules.filter((rule) => rule.type === "model");
    const results: ValidationResult[] = [];

    const ruleArgs = {
      model,
      threats,
      controls,
      mitigations,
      threatSuggestions,
      controlSuggestions,
    };

    // Validate model
    for (const rule of modelRules) {
      if (!isModelValidation(rule)) {
        continue;
      }

      if (rule.conditionalRules && rule.conditionalRules.length > 0) {
        const conditions = rule.conditionalRules.map(async (condition) => {
          return await condition(ruleArgs);
        });
        const results = await Promise.all(conditions);

        const areAllConditionsMet = results.every((condition) => condition);

        if (!areAllConditionsMet) {
          continue;
        }
      }

      try {
        const testResult = await rule.test(ruleArgs);
        results.push({
          type: rule.type,
          elementName: "Model",
          ruleName: rule.name,
          testResult: testResult,
          message: testResult ? rule.messageTrue : rule.messageFalse,
        });
      } catch (err) {
        this.log.error(`Error validating model ${modelId}`, err);
      }
    }

    // Validate components
    for (const component of components) {
      for (const rule of componentRules) {
        if (!isComponentValidation(rule)) {
          continue;
        }
        //Skip the rule if conditional rules are not met
        if (rule.conditionalRules && rule.conditionalRules.length > 0) {
          for (const condition of rule.conditionalRules) {
            const isConditionMet = await condition(ruleArgs);
            if (!isConditionMet) {
              continue;
            }
          }
        }
        try {
          const testResult = await rule.test({
            ...ruleArgs,
            component,
            dataflows: dataFlows,
          });
          results.push({
            type: rule.type,
            elementId: component.id,
            elementName: component.name,
            ruleName: rule.name,
            testResult: testResult,
            message: testResult ? rule.messageTrue : rule.messageFalse,
          });
        } catch (err) {
          this.log.error(`Error validating model ${modelId}`, err);
        }
      }
    }

    this.cache.set(modelId, results);
    this.log.debug(`Validation results for ${modelId} are ${results}`);

    this.emit("updated-for", { modelId });
  }

  async getResults(modelId: string): Promise<ValidationResult[]> {
    if (!this.cache.has(modelId)) {
      await this.validate(modelId);
      return this.cache.get(modelId)!;
    }
    return this.cache.get(modelId)!;
  }
}

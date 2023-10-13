import { randomUUID } from "crypto";
import {
  EngineSuggestedControl,
  EngineSuggestedThreat,
  SuggestionID,
} from "../suggestions/models.js";

export function genSuggestedThreat(
  componentId: string = randomUUID()
): EngineSuggestedThreat {
  return {
    id: new SuggestionID(`${componentId}/test-source/threat/t-${randomUUID()}`),
    componentId,
    description: `description of threat - ${randomUUID()}`,
    slug: `t-${randomUUID()}`,
    title: `threat ${randomUUID()}`,
    reason: `reason for ${randomUUID()}`,
    source: "test",
  };
}

export function genSuggestedControl(
  options: {
    componentId?: string;
    mitigates?: { partialThreatId: string }[];
  } = {
    componentId: randomUUID(),
    mitigates: [],
  }
): EngineSuggestedControl {
  return {
    id: new SuggestionID(
      `${options.componentId}/test-source/control/t-${randomUUID()}`
    ),
    componentId: options.componentId || randomUUID(),
    description: `description of control - ${randomUUID()}`,
    slug: `t-${randomUUID()}`,
    title: `control ${randomUUID()}`,
    reason: `reason for ${randomUUID()}`,
    mitigates: options.mitigates || [],
    source: "test",
  };
}

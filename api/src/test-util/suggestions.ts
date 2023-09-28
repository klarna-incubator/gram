import { randomUUID } from "crypto";
import {
  EngineSuggestedControl,
  EngineSuggestedThreat,
  SuggestionID,
} from "@gram/core/dist/suggestions/models.js";

export function genSuggestedThreat(): EngineSuggestedThreat {
  const componentId = randomUUID();
  return {
    id: new SuggestionID(`${componentId}/test-source/threat/t-${randomUUID()}`),
    componentId,
    description: `description of threat - ${randomUUID()}`,
    slug: `t-${randomUUID()}`,
    title: `threat ${randomUUID()}`,
    reason: `reason for ${randomUUID()}`,
  };
}

export function genSuggestedControl(
  mitigates: { partialThreatId: string }[] = []
): EngineSuggestedControl {
  const componentId = randomUUID();
  return {
    id: new SuggestionID(
      `${componentId}/test-source/control/t-${randomUUID()}`
    ),
    componentId,
    description: `description of control - ${randomUUID()}`,
    slug: `t-${randomUUID()}`,
    title: `control ${randomUUID()}`,
    reason: `reason for ${randomUUID()}`,
    mitigates,
  };
}

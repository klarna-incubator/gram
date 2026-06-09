import { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import { GramActionItemCreatePayload } from "./types.js";

export const SECURE_DEVELOPMENT_ORG_UNIT = "Q8564"; // Placeholder for Secure Development (Org Unit)

export type PRIORITY_TYPE = 1 | 2 | 3; // 1: Critical, 2: High, 3: Medium

export const SKIP_REASONS: Record<string, string> = {
  SEVERITY_LOW: "Low severity action items are not exported",
  ALREADY_EXPORTED: "Action item is already exported to one or more tickets.",
  UPDATED: "Action item has been updated in Wikibase.",
  NO_SYSTEM_ID: "Action item has no system ID.",
  NO_MODEL_ID: "Action item has no model ID.",
};

export const UPDATE_REASONS: Record<string, string> = {
  EXPORTED_BUT_IN_TREATMENT:
    "Action item has been exported to Success Dashboard but is still in treatment.",
};
export const LOW_SEVERITIES: ThreatSeverity[] = [
  ThreatSeverity.Informative,
  ThreatSeverity.Low,
];

export const SUCCESS_DASHBOARD_URL_DOMAIN = "klarna-dashboards.klarna.net";
export const WIKIBASE_URL_DOMAIN = "knowledgegraph.klarna.net";

// ThreatSeverity uses Gram terms; Success Dashboard uses ranked labels.
// `informative` has no SD equivalent.
export const SEVERITY_MAP: Record<
  ThreatSeverity,
  GramActionItemCreatePayload["severity"]
> = {
  [ThreatSeverity.Critical]: "1 Critical",
  [ThreatSeverity.High]: "2 Major",
  [ThreatSeverity.Medium]: "3 Moderate",
  [ThreatSeverity.Low]: "4 Minor",
  [ThreatSeverity.Informative]: "4 Minor",
};

export const PRIORITY_MAP: Partial<Record<ThreatSeverity, PRIORITY_TYPE>> = {
  [ThreatSeverity.Critical]: 1,
  [ThreatSeverity.High]: 2,
  [ThreatSeverity.Medium]: 3,
};

export const SLA_IN_DAYS_MAP: Partial<Record<ThreatSeverity, number>> = {
  [ThreatSeverity.Critical]: 30,
  [ThreatSeverity.High]: 90,
  [ThreatSeverity.Medium]: 180,
  [ThreatSeverity.Low]: 365,
  [ThreatSeverity.Informative]: 365,
};

export const THREAT_MODEL_FINDING_TAG = "fe1b06db-986b-43f4-8e04-22aa43e46b99";
export const SECURITY_FINDING_TAG = "23afa588-a4d5-4965-bf60-718b7567491c";

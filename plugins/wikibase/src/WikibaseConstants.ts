import { PropertyId } from "wikibase-sdk";

export const PROPERTIES: Record<string, PropertyId> = {
  INSTANCE_OF: "P359",
  ACCOUNTABLE: "P363",
  REPORTER_TEAM: "P3808",
  ENTITY_CREATED_ON: "P4119",
  PRIORITY_RANK: "P3096",
  RELATED_TO: "P1035",
  OBSERVED_ISSUE: "P2264",
  SUGGESTED_SOLUTION: "P2408",
  STATUS: "P726",
  DUE_DATE: "P3781",
  REPORTED_ESTIMATED_EFFORT: "P4031",
};

export const QUALIFIERS: Record<string, PropertyId> = {
  CONTRIBUTOR: "P319",
  URL: "P688",
};

//Values
export const KLARNA_KNOWLEDGE_GRAPH = "Q52173";
export const TASK = "Q2130264";
export const THREAT_MODEL_FINDING = "Q2182877";
export const SECURITY_FINDING = "Q2049036";

export const INSTANCE_OF_LIST = [
  KLARNA_KNOWLEDGE_GRAPH,
  TASK,
  THREAT_MODEL_FINDING,
  SECURITY_FINDING,
] as const; // Klarna's Knowledge Graph, Task, Threat Model Finding, Security Finding

export type InstanceOfListType = [
  typeof KLARNA_KNOWLEDGE_GRAPH,
  typeof TASK,
  typeof THREAT_MODEL_FINDING,
  typeof SECURITY_FINDING,
];

export const SECURE_DEVELOPMENT_ORG_UNIT = "Q8564"; // Placeholder for Secure Development (Org Unit)
export const SECURITY_ENABLEMENT_ORG_UNIT = "Q1926181"; // Placeholder for Security Enablement (Org Unit)

export type REPORTER_TEAM_TYPE =
  | typeof SECURE_DEVELOPMENT_ORG_UNIT
  | typeof SECURITY_ENABLEMENT_ORG_UNIT;

export type PRIORITY_TYPE = 1 | 2 | 3; // 1: Critical, 2: High, 3: Medium
export const NEW = "Q1605299";
export const BACKLOG = "Q1822716";

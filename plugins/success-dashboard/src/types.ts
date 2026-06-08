import { THREAT_MODEL_FINDING_TAG, SECURITY_FINDING_TAG } from "./constant.js";

export interface SuccessDashboardApiClientOptions {
  /**
   * Success Dashboard service origin (no trailing slash required).
   * When omitted, defaults to the EU production deployment.
   */
  baseUrl?: string;
  /** Bearer token for `Authorization` (Okta JWT). Required against prod. */
  apiToken?: string;
  /** Override for tests */
  fetchImpl?: typeof fetch;
}

/**
 * Create-ticket response shape from the AIM V2 API documentation.
 * This may evolve as the API changes.
 */
export interface SuccessDashboardCreateResultData {
  id: string;
  title: string;
  typeId: string;
  statusId: string;
  qid: string | null;
}

export interface SuccessDashboardCreateResultSync {
  success: boolean;
  mode: string;
  message: string;
}

export interface SuccessDashboardCreateResult {
  success: boolean;
  error?: string;
  /** Success Dashboard internal UUID — persist this to drive later update/delete. */
  id: string;
  qid: string | null;
  data: SuccessDashboardCreateResultData;
  sync: SuccessDashboardCreateResultSync;
}

export interface SuccessDashboardUpdateResult {
  success: boolean;
  error?: string;
  /** Success Dashboard internal UUID — persist this to drive later update/delete. */
  id: string;
  /** Wikibase QID, populated because we POST with `?awaitSync=true`. */
  qid: string | null;
}

export interface RequestOptions {
  method: string;
  path: string;
  apiPrefix?: string;
  query?: Record<string, string | boolean>;
  body?: unknown;
}

export interface SuccessDashboardActionItemExporterOptions {
  /** Success Dashboard API client options */
  apiConfig?: SuccessDashboardApiClientOptions;
  /** Export on review approved */
  exportOnReviewApproved?: boolean;
  /** Public Gram base URL */
  gramBaseUrl?: string;
  successDashboardUrl?: string;
  /** Bearer token for `Authorization` (Okta JWT). Required against prod. */
  successDashboardapiToken?: string;
  /** Override for tests */
}

export type OrgRelations = {
  relation:
    | "reporting_team"
    | "reporting_contributor"
    | "accountable_team"
    | "accountable_contributor"
    | "accountable_cxo";
  orgUnit?: {
    externalId: string;
    name: string;
  };
  user?: {
    externalId: string;
    name: string;
  };
}[];

/**
 * JSON body sent to the Success Dashboard ingest endpoint for one Gram action item.
 * Align field names with your Success Dashboard API contract; this shape is a stable starting point.
 */
export interface GramActionItemCreatePayload {
  title: string;
  typeId: "actionable_improvement";
  description: string;
  dueDate: string; // eg. "2026-07-20T00:00:00Z"
  estimatedEffort: 1;
  observedIssue: string;
  suggestedSolution: string;
  url?: string;
  statusId?: string;
  statusDescription?: string;
  mainSystem?: string; // QID of the main system
  priority?: 1 | 2 | 3; // 1: Critical, 2: High, 3: Medium
  severity?: "1 Critical" | "2 Major" | "3 Moderate" | "4 Minor";
  orgRelations?: OrgRelations;
  attributes?: {
    observed_issue_url: string;
  };
  tagIds: [typeof THREAT_MODEL_FINDING_TAG, typeof SECURITY_FINDING_TAG]; // [THREAT_MODEL_FINDING_TAG, SECURITY_FINDING_TAG]
}

export interface GramActionItemUpdatePayload
  extends Partial<GramActionItemCreatePayload> {}

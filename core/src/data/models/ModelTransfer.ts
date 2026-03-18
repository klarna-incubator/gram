import { ThreatSeverity } from "../threats/Threat.js";
import { LinkObjectType } from "../links/Link.js";
import { FlowAttributes } from "../flow/Flow.js";
import { ReviewStatus } from "../reviews/Review.js";
import { SuggestionStatus } from "../suggestions/Suggestion.js";
import { Component, DataFlow } from "./Model.js";

export const MODEL_TRANSFER_SCHEMA_VERSION = 1;

export type ImportMode = "create-new" | "in-place";

export interface ModelExportMetadata {
  schemaVersion: number;
  exportedAt: string;
  exportedBy: string;
  aiInstructions?: {
    purpose: string;
    editRules: string[];
  };
}

export interface ModelExportModel {
  id: string;
  systemId: string | null;
  version: string;
  isTemplate?: boolean;
  shouldReviewActionItems?: boolean | null;
}

export interface ModelExportThreat {
  id: string;
  title: string;
  description: string | null;
  componentId: string;
  isActionItem?: boolean;
  severity?: ThreatSeverity | null;
  suggestionId?: string;
}

export interface ModelExportControl {
  id: string;
  title: string;
  description: string | null;
  inPlace: boolean;
  componentId: string;
  suggestionId?: string;
}

export interface ModelExportMitigation {
  threatId: string;
  controlId: string;
}

export interface ModelExportSuggestedThreat {
  id: string;
  componentId: string;
  title: string;
  description: string;
  reason?: string | null;
  status: SuggestionStatus;
  source: string;
}

export interface ModelExportSuggestedControl {
  id: string;
  componentId: string;
  title: string;
  description: string;
  reason?: string | null;
  status: SuggestionStatus;
  source: string;
  mitigates: { partialThreatId: string }[];
}

export interface ModelExportLink {
  objectType: LinkObjectType;
  objectId: string;
  label: string;
  url: string;
  icon: string;
}

export interface ModelExportFlow {
  dataFlowId: string;
  originComponentId: string;
  summary: string;
  attributes: FlowAttributes;
}

export interface ModelExportResourceMatching {
  resourceId: string;
  componentId: string | null;
}

export interface ModelExportReview {
  status: ReviewStatus;
  note: string;
  requestedBy: string;
  reviewedBy: string;
  extras?: object;
}

export interface ModelExportPayload {
  metadata: ModelExportMetadata;
  model: ModelExportModel;
  modelData: {
    components: Component[];
    dataFlows: (Omit<DataFlow, "bidirectional"> & {
      bidirectional?: boolean;
    })[];
  };
  threats: ModelExportThreat[];
  controls: ModelExportControl[];
  mitigations: ModelExportMitigation[];
  suggestions: {
    threats: ModelExportSuggestedThreat[];
    controls: ModelExportSuggestedControl[];
  };
  links: ModelExportLink[];
  flows: ModelExportFlow[];
  resourceMatchings: ModelExportResourceMatching[];
  review: ModelExportReview | null;
}

export interface ModelImportOptions {
  mode: ImportMode;
  importedBy: string;
  targetModelId?: string;
}

export interface ModelImportResult {
  modelId: string;
}

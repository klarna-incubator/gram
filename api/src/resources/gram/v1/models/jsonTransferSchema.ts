import { LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import { ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { SuggestionStatus } from "@gram/core/dist/data/suggestions/Suggestion.js";
import { z } from "zod";

const ComponentSchema = z.object({
  id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  type: z.enum(["ee", "ds", "proc", "tb"]),
  width: z.number().optional(),
  height: z.number().optional(),
  name: z.string(),
  classes: z.array(z.any()).optional(),
  description: z.string().optional(),
  systems: z.array(z.string()).optional(),
});

const DataFlowSchema = z.object({
  id: z.string().uuid(),
  endComponent: z.object({
    id: z.string().uuid(),
  }),
  startComponent: z.object({
    id: z.string().uuid(),
  }),
  label: z.string().optional(),
  labelAnchor: z.number().optional(),
  points: z.array(z.number()),
  bidirectional: z.boolean().optional(),
});

const SuggestedThreatSchema = z.object({
  id: z.string(),
  componentId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  reason: z.string().nullable().optional(),
  status: z.nativeEnum(SuggestionStatus),
  source: z.string(),
});

const SuggestedControlSchema = z.object({
  id: z.string(),
  componentId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  reason: z.string().nullable().optional(),
  status: z.nativeEnum(SuggestionStatus),
  source: z.string(),
  mitigates: z.array(
    z.object({
      partialThreatId: z.string(),
    })
  ),
});

export const ModelJsonTransferPayloadSchema = z.object({
  metadata: z.object({
    schemaVersion: z.number().int().nonnegative(),
    exportedAt: z.string(),
    exportedBy: z.string(),
    aiInstructions: z
      .object({
        purpose: z.string(),
        editRules: z.array(z.string()),
      })
      .optional(),
  }),
  model: z.object({
    id: z.string().uuid(),
    systemId: z.string().nullable(),
    version: z.string().min(1),
    isTemplate: z.boolean().optional(),
    shouldReviewActionItems: z.boolean().nullable().optional(),
  }),
  modelData: z.object({
    components: z.array(ComponentSchema),
    dataFlows: z.array(DataFlowSchema),
  }),
  threats: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().nullable(),
      // Attachment target id: can be either component id or data-flow id.
      componentId: z.string().uuid(),
      isActionItem: z.boolean().optional(),
      severity: z.nativeEnum(ThreatSeverity).nullable().optional(),
      suggestionId: z.string().optional(),
    })
  ),
  controls: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().nullable(),
      inPlace: z.boolean(),
      // Attachment target id: can be either component id or data-flow id.
      componentId: z.string().uuid(),
      suggestionId: z.string().optional(),
    })
  ),
  mitigations: z.array(
    z.object({
      threatId: z.string().uuid(),
      controlId: z.string().uuid(),
    })
  ),
  suggestions: z.object({
    threats: z.array(SuggestedThreatSchema),
    controls: z.array(SuggestedControlSchema),
  }),
  links: z.array(
    z.object({
      objectType: z.nativeEnum(LinkObjectType),
      objectId: z.string(),
      label: z.string(),
      url: z.string(),
      icon: z.string(),
    })
  ),
  flows: z.array(
    z.object({
      dataFlowId: z.string().uuid(),
      originComponentId: z.string().uuid(),
      summary: z.string(),
      attributes: z.record(z.any()),
    })
  ),
  resourceMatchings: z.array(
    z.object({
      resourceId: z.string(),
      componentId: z.string().uuid().nullable(),
    })
  ),
  review: z
    .object({
      status: z.nativeEnum(ReviewStatus),
      note: z.string(),
      requestedBy: z.string(),
      reviewedBy: z.string(),
      extras: z.record(z.any()).optional(),
    })
    .nullable(),
});

export const ImportJsonRequestSchema = z.object({
  mode: z.literal("in-place"),
  targetModelId: z.string().uuid(),
  payload: ModelJsonTransferPayloadSchema,
});

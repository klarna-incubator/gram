import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import {
  ActionItemFilter,
  ExportStatusFilter,
} from "@gram/core/dist/data/threats/ThreatDataService.js";
import { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import { z } from "zod";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

/** Accept an ISO 8601 date or date-time string (Postgres timestamptz casts both). */
const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "must be an ISO 8601 date");

const severityEnum = z.nativeEnum(ThreatSeverity);

/** A single export domain: trimmed, must be non-empty. */
const exportDomainItem = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, "must not be empty");

const QuerySchema = z.object({
  systemId: z.union([z.string(), z.array(z.string())]).optional(),
  createdFrom: isoDate.optional(),
  createdTo: isoDate.optional(),
  reviewApprovedFrom: isoDate.optional(),
  reviewApprovedTo: isoDate.optional(),
  severity: z.union([severityEnum, z.array(severityEnum)]).optional(),
  exportDomain: z
    .union([exportDomainItem, z.array(exportDomainItem)])
    .optional(),
  exportStatus: z.enum(["exported", "not-exported"]).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/v1/admin/action-items
 * Admin-only filtered fetch of action items across all systems/models.
 * Admin role is enforced at the router mount; this handler is a thin wrapper.
 */
export function listAdminActionItems(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const q = parsed.data;

    const systemIds =
      q.systemId === undefined
        ? undefined
        : Array.isArray(q.systemId)
        ? q.systemId
        : [q.systemId];

    const severities =
      q.severity === undefined
        ? undefined
        : Array.isArray(q.severity)
        ? q.severity
        : [q.severity];

    const exportDomain =
      q.exportDomain === undefined
        ? undefined
        : Array.isArray(q.exportDomain)
        ? q.exportDomain
        : [q.exportDomain];

    const filter: ActionItemFilter = {
      systemIds,
      createdFrom: q.createdFrom,
      createdTo: q.createdTo,
      reviewApprovedFrom: q.reviewApprovedFrom,
      reviewApprovedTo: q.reviewApprovedTo,
      severities,
      exportStatus: q.exportStatus as ExportStatusFilter | undefined,
      exportDomain,
      limit: q.limit,
      offset: q.offset,
    };

    const { total, items } = await dal.threatService.listActionItemsFiltered(
      filter
    );

    res.json({
      total,
      limit: q.limit,
      offset: q.offset,
      actionItems: items.map((item) => ({
        ...item.threat.toJSON(),
        systemId: item.systemId,
        reviewApprovedAt: item.reviewApprovedAt,
        exported: item.exported,
        exportLinks: item.exportLinks,
      })),
    });
  };
}

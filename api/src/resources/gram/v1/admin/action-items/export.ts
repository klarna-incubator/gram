import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import { z } from "zod";

const MAX_BATCH = 100;

export type ExportOutcome =
  | "exported"
  | "alreadyExported"
  | "notExported"
  | "notFound"
  | "notAnActionItem";

export interface ExportResult {
  threatId: string;
  outcome: ExportOutcome;
  link?: string;
}

const BodySchema = z.object({
  exporterKey: z.string(),
  threatIds: z.array(z.string()).min(1).max(MAX_BATCH),
});

const emptySummary = (): Record<ExportOutcome, number> => ({
  exported: 0,
  alreadyExported: 0,
  notExported: 0,
  notFound: 0,
  notAnActionItem: 0,
});

/**
 * POST /api/v1/admin/action-items/export
 * Re-export an explicit list of action items to one exporter, synchronously.
 * Per-threat outcome is derived by link-diff (exporter links before/after),
 * never from the exporter's void return. Admin role enforced at router mount.
 */
export function exportAdminActionItems(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { exporterKey } = parsed.data;

    const registeredKeys = dal.actionItemHandler.exporters.map((e) => e.key);
    if (!registeredKeys.includes(exporterKey)) {
      res.status(400).json({ error: `Unknown exporterKey: ${exporterKey}` });
      return;
    }

    // Dedup requested ids; the summary partitions exactly this set.
    const requestedIds = [...new Set(parsed.data.threatIds)];

    // Partition: notFound (absent/deleted) vs notAnActionItem vs eligible.
    const threats = await dal.threatService.listByIds(requestedIds);
    const byId = new Map(threats.map((t) => [t.id!, t]));

    const results: ExportResult[] = [];
    const eligible = [];
    for (const id of requestedIds) {
      const threat = byId.get(id);
      if (!threat) {
        results.push({ threatId: id, outcome: "notFound" });
      } else if (!threat.isActionItem) {
        results.push({ threatId: id, outcome: "notAnActionItem" });
      } else {
        eligible.push(threat);
      }
    }

    const eligibleIds = eligible.map((t) => t.id!);

    // BEFORE snapshot — which eligible threats already had an exporter link.
    const before = await dal.linkService.listLinksForObjects(
      LinkObjectType.Threat,
      eligibleIds,
      exporterKey
    );
    const hadLinkBefore = new Set(before.map((l) => l.objectId));

    if (eligible.length > 0) {
      await dal.actionItemHandler.export(exporterKey, eligible);
    }

    // AFTER snapshot — link url per eligible threat (if any).
    const after = await dal.linkService.listLinksForObjects(
      LinkObjectType.Threat,
      eligibleIds,
      exporterKey
    );
    const linkAfter = new Map(after.map((l) => [l.objectId, l.url]));

    for (const threat of eligible) {
      const id = threat.id!;
      const url = linkAfter.get(id);
      if (hadLinkBefore.has(id)) {
        results.push({ threatId: id, outcome: "alreadyExported", link: url });
      } else if (url !== undefined) {
        results.push({ threatId: id, outcome: "exported", link: url });
      } else {
        results.push({ threatId: id, outcome: "notExported" });
      }
    }

    const summary = emptySummary();
    for (const r of results) {
      summary[r.outcome] += 1;
    }

    res.json({
      exporterKey,
      requested: requestedIds.length,
      summary,
      results,
    });
  };
}

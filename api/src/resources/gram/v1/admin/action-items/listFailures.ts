import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { z } from "zod";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const QuerySchema = z
  .object({
    exporter: z.string().optional(),
    modelId: z.string().optional(),
    threatId: z.string().optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
    offset: z.coerce.number().int().min(0).default(0),
  })
  // Strict so a misspelled filter fails loudly instead of being dropped.
  .strict();

export function listAdminActionItemExportFailures(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const q = parsed.data;

    const failures = await dal.actionItemHandler.listFailures({
      exporter: q.exporter,
      modelId: q.modelId,
      threatId: q.threatId,
      createdAfter: q.createdAfter,
      createdBefore: q.createdBefore,
      limit: q.limit,
      offset: q.offset,
    });
    res.json({
      count: failures.length,
      limit: q.limit,
      offset: q.offset,
      failures,
      filters: q,
    });
  };
}

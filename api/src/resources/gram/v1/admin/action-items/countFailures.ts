import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { z } from "zod";

const QuerySchema = z
  .object({
    exporter: z.string().optional(),
    modelId: z.string().optional(),
    threatId: z.string().optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
  })
  // Strict so a misspelled filter fails loudly instead of being dropped.
  .strict();

export function countAdminActionItemExportFailures(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const q = parsed.data;

    const count = await dal.actionItemHandler.countFailures({
      exporter: q.exporter,
      modelId: q.modelId,
      threatId: q.threatId,
      createdAfter: q.createdAfter,
      createdBefore: q.createdBefore,
    });
    res.json({ count, filters: q });
  };
}

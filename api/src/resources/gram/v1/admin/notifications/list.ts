import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { z } from "zod";

// Strict so an unsupported or misspelled filter fails loudly. Without it zod
// drops unknown keys and the request silently returns unfiltered rows.
const QuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    offset: z.coerce.number().int().min(0).default(0),
    status: z.enum(["new", "pending", "sent", "failed", "dropped"]).optional(),
    template_key: z.string().optional(),
    type: z.string().optional(),
    modelId: z.string().optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
  })
  .strict();

export function listNotifications(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const q = parsed.data;
    const notifications = await dal.notificationService.listNotifications({
      limit: q.limit,
      offset: q.offset,
      status: q.status,
      template_key: q.template_key,
      type: q.type,
      modelId: q.modelId,
      createdAfter: q.createdAfter,
      createdBefore: q.createdBefore,
    });
    res.json({ notifications });
  };
}

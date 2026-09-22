import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export function deleteNotificationById(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const parsed = ParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const p = parsed.data;
    const result = await dal.notificationService.deleteNotificationById(p.id);
    res.json({ result });
  };
}

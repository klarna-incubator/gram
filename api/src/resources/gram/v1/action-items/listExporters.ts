import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export function listExporters(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    return res.json({
      exporterKeys: dal.actionItemHandler.exporters.map((e) => e.key),
    });
  };
}

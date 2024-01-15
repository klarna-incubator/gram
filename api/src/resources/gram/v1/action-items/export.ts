/**
 * GET /api/v1/models
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { z } from "zod";

/**
 * ActionItemToExportSchema used to validate ActionItem export requests. (Experiment with zod)
 */
export const ActionItemToExportSchema = (exporterKeys: any) =>
  z.object({
    exporterKey: z.enum(exporterKeys),
    threatId: z.string().max(255),
  });

export function exportActionItem(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const exporterKeys = dal.actionItemHandler.exporters.map((e) => e.key);
    const actionItem = ActionItemToExportSchema(exporterKeys).parse(req.body);
    const threat = await dal.threatService.getById(actionItem.threatId);

    if (!threat) {
      return res.sendStatus(404);
    }

    await req.authz.hasPermissionsForModelId(threat.modelId, Permission.Write);

    const exporter = dal.actionItemHandler.exporters.filter(
      (e) => e.key === actionItem.exporterKey
    );

    if (exporter.length === 0) {
      return res
        .json({ error: { message: "No such exporter" } })
        .sendStatus(404);
    }

    await exporter[0].export(dal, [threat]);

    return res.json({ success: true });
  };
}

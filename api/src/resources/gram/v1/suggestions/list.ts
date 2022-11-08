/**
 * GET /api/v1/suggestions/{modelId}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { DataAccessLayer } from "../../../../data/dal";
import { validateUUID } from "../../../../util/uuid";

export default function list(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;

    if (!validateUUID(modelId)) {
      res.status(400);
      return res.json({ message: "Invalid modelID" });
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);

    const controls = await dal.suggestionService.listControlSuggestions(
      modelId
    );
    const threats = await dal.suggestionService.listThreatSuggestions(modelId);

    return res.json({ controls, threats });
  };
}

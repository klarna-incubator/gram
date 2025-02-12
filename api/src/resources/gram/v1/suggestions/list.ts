/**
 * GET /api/v1/suggestions/{modelId}
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { validateUUID } from "@gram/core/dist/util/uuid.js";

export default function list(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;

    if (!validateUUID(modelId)) {
      res.status(400);
      res.json({ message: "Invalid modelID" });
      return;
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Read);

    const controls = await dal.suggestionService.listControlSuggestions(
      modelId
    );
    const threats = await dal.suggestionService.listThreatSuggestions(modelId);

    res.json({ controls, threats });
    return;
  };
}

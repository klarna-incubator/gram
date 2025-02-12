/**
 * PATCH /api/v1/suggestions/{modelId}/accept
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { SuggestionID } from "@gram/core/dist/suggestions/models.js";
import { validateUUID } from "@gram/core/dist/util/uuid.js";

export default function accept(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;
    const suggestionId = new SuggestionID(req.body.suggestionId);

    if (!validateUUID(modelId)) {
      res.status(400);
      res.json({ message: "Invalid modelID" });
      return;
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    const result = await dal.suggestionService.acceptSuggestion(
      modelId,
      suggestionId,
      req.user.sub
    );

    if (!result) res.status(404);
    res.json({ result });
    return;
  };
}

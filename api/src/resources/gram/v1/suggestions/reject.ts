/**
 * PATCH /api/v1/suggestions/{modelId}/reject
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { SuggestionStatus } from "@gram/core/dist/data/suggestions/Suggestion";
import { SuggestionID } from "@gram/core/dist/suggestions/models";
import { validateUUID } from "@gram/core/dist/util/uuid";

export default function reject(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { modelId } = req.params;

    const suggestionId = new SuggestionID(req.body.suggestionId);

    if (!validateUUID(modelId)) {
      res.status(400);
      return res.json({ message: "Invalid modelID" });
    }

    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    const result = await dal.suggestionService.setSuggestionStatus(
      modelId,
      suggestionId,
      SuggestionStatus.Rejected
    );

    if (!result) res.status(404);

    return res.json({ result });
  };
}

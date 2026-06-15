/**
 * PATCH /api/v1/reviews/{id}
 * @exports {function} handler
 */
import { Request, Response } from "express";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

import { routeParams } from "../../../../util/routeParams.js";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { modelId } = routeParams(req.params);

    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    const result = await dal.reviewService.cancel(modelId);

    res.json({ result });
    return;
  };

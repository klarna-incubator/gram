/**
 * GET /api/v1/systems/<id>/permissions
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { getPermissionsForSystem } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const permissions = await getPermissionsForSystem(
      { currentRequest: req },
      req.params.id,
      req.user
    );
    return res.json({ permissions });
  };

/**
 * GET /api/v1/models
 * @exports {function} handler
 */

import { Request, Response } from "express";
import {
  ModelFilter,
  ModelFilters,
  ModelListOptions,
} from "@gram/core/dist/data/models/ModelDataService.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { filter } = req.query;

    if (
      !filter ||
      !(typeof filter === "string") ||
      !ModelFilters.includes(filter)
    ) {
      res.sendStatus(400);
      return;
    }

    const opts: ModelListOptions = {
      withSystems: req.query.withSystems === "true",
      user: req.user.sub,
      systemId: req.query.systemId?.toString(),
    };

    const models = await dal.modelService.list(filter as ModelFilter, opts);
    res.json({ models: models.map((model) => model.toJSON()) });
    return;
  };

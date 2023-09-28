/**
 * GET /api/v1/models
 * @exports {function} handler
 */

import { Request, Response } from "express";
import {
  ModelDataService,
  ModelFilter,
  ModelFilters,
  ModelListOptions,
} from "@gram/core/dist/data/models/ModelDataService.js";

export default (dataModels: ModelDataService) =>
  async (req: Request, res: Response) => {
    const { filter } = req.query;

    if (
      !filter ||
      !(typeof filter === "string") ||
      !ModelFilters.includes(filter)
    ) {
      return res.sendStatus(400);
    }

    const opts: ModelListOptions = {
      withSystems: req.query.withSystems === "true",
      user: req.user.sub,
      systemId: req.query.systemId?.toString(),
    };

    const models = await dataModels.list(filter as ModelFilter, opts);
    return res.json({ models: models.map((model) => model.toJSON()) });
  };

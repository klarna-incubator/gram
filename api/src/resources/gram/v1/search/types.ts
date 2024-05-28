import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request } from "@sentry/node";
import { Response } from "express";

export function getSearchTypes(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const searchTypes = dal.searchHandler.validSearchTypes();
    return res.json({ searchTypes });
  };
}

import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Response, Request } from "express";

export function getSearchTypes(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const searchTypes = dal.searchHandler.validSearchTypes();
    res.json({ searchTypes });
    return;
  };
}

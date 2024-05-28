import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";
import { z } from "zod";

export const SearchSchema = (searchTypes: any) =>
  z.object({
    types: z.array(z.enum(searchTypes)).nonempty(),
    searchText: z.string().max(255),
    page: z.number().int().gte(0).default(0),
  });

export function search(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const searchBody = SearchSchema(
      dal.searchHandler.validSearchTypes().map((s) => s.key)
    ).parse(req.body);
    const result = await dal.searchHandler.search({
      searchText: searchBody.searchText,
      types: searchBody.types,
      page: searchBody.page,
      pageSize: 10,
    });

    return res.json(result);
  };
}

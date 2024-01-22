import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import {
  LinkObjectId,
  LinkObjectType,
} from "@gram/core/dist/data/links/Link.js";
import { Permission } from "@gram/core/dist/auth/authorization.js";
import { checkLinkPermission } from "./permission.js";
import { z } from "zod";

export function getLinks(dal: DataAccessLayer) {
  const schema = z.object({
    objectType: z.nativeEnum(LinkObjectType),
    objectId: z.string(),
  });

  return async (req: Request, res: Response) => {
    const input = schema.parse(req.query);

    // Check if user has access to this object
    await checkLinkPermission(
      dal,
      req,
      input.objectType,
      input.objectId,
      Permission.Read
    );

    res.json({
      links: await dal.linkService.listLinks(input.objectType, input.objectId),
    });
  };
}

import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";
import { LinkSchema } from "./LinkSchema.js";
import { checkLinkPermission } from "./permission.js";

export function insertLink(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const link = LinkSchema.parse(req.body);

    // Check if user has access to this object
    await checkLinkPermission(
      dal,
      req,
      link.objectType,
      link.objectId,
      Permission.Write
    );

    const newLink = await dal.linkService.insertLink(
      link.objectType,
      link.objectId,
      link.label,
      link.url,
      link.icon,
      req.authz.user.sub
    );

    res.json({
      link: newLink,
    });
  };
}

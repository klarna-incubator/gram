import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";
import { checkLinkPermission } from "./permission.js";

export function deleteLink(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const linkId = req.params.linkId;

    if (!linkId) {
      res.status(400).json({ message: "Missing objectType or objectId" });
      return;
    }

    const id = parseInt(linkId);
    const link = await dal.linkService.getById(id);

    if (!link) {
      res.status(404).json({ message: "Link not found" });
      return;
    }

    // Check if user has access to this object
    await checkLinkPermission(
      dal,
      req,
      link.objectType,
      link.objectId,
      Permission.Delete
    );

    await dal.linkService.deleteLink(id);

    res.status(204).json();
  };
}

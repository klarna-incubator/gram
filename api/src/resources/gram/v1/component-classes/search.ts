/**
 * GET /api/v1/component-classes/?type=datastore&search=S3
 * @exports {function} handler
 */
import { Request, Response } from "express";
import {
  ComponentClassHandler,
  ComponentTypes,
  ComponentType,
} from "@gram/core/dist/data/component-classes";

export const searchClasses =
  (ccHandler: ComponentClassHandler) => async (req: Request, res: Response) => {
    const type = req.query.type;
    const search = req.query.search;

    if (typeof type !== "string" || !ComponentTypes.includes(type)) {
      return res
        .status(400)
        .json({ error: `type must be one of ${ComponentTypes}` });
    }

    if (typeof search !== "string") {
      return res
        .status(400)
        .json({ error: `invalid search parameter (not a string?)` });
    }

    const classes = ccHandler.search(type as ComponentType, search);

    return res.json({
      truncated: classes.length > 50,
      count: classes.length,
      classes: classes.slice(0, 50),
    });
  };

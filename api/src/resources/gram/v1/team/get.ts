import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export function getTeam(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const id = req.params.id;

    const team = await dal.teamHandler.getTeam({ currentRequest: req }, id);

    if (team === null) {
      res.sendStatus(404);
      return;
    }

    res.json({ team });
    return;
  };
}

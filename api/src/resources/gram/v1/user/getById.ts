/**
 * GET /api/v1/users/:id
 *
 * Looks up a user by id
 *
 * @exports {function} handler
 */
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Request, Response } from "express";

export const getById =
  (dal: DataAccessLayer) => async (req: Request, res: Response) => {
    const userId = req.params.userId;

    const user = await dal.userHandler.lookupUser(
      { currentRequest: req },
      userId
    );

    if (!user) {
      return res.sendStatus(404);
    }

    res.json({ ...user });
  };

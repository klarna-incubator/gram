import { Request, Response } from "express";
import { config } from "@gram/core/dist/config/index.js";

export const getContact = async (req: Request, res: Response) => {
  res.json({ contact: config.contact });
};

import { Request, Response } from "express";
import { config } from "@gram/core/dist/config/index.js";

export const getFlowAttributes = async (req: Request, res: Response) => {
  res.json({ attributes: config.attributes.flow });
};

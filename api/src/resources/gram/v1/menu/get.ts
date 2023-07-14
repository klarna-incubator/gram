import { Request, Response } from "express";
import { config } from "@gram/core/dist/config";

export const getMenu = async (req: Request, res: Response) => {
  res.json({ menu: config.menu });
};

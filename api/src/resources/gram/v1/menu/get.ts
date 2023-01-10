import config from "config";
import { Request, Response } from "express";

export const getMenu = async (req: Request, res: Response) => {
  const menu = config.has("menu") ? config.get("menu") : [];
  res.json({ menu });
};

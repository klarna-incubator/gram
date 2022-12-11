import { Request, Response } from "express";
import { DataAccessLayer } from "../../../../data/dal";

export const getBanner =
  (dal: DataAccessLayer) => async (req: Request, res: Response) => {
    res.json({ banners: await dal.bannerService.listBanners() });
  };

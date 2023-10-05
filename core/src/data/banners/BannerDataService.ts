import pg from "pg";
import log4js from "log4js";
import { DataAccessLayer } from "../dal.js";

interface Banner {
  id: number;
  type: string;
  text: "warning" | "error" | "info" | "success";
  active: boolean;
}

export class BannerDataService {
  constructor(private pool: pg.Pool, private dal: DataAccessLayer) {}

  log = log4js.getLogger("BannerDataService");

  async listBanners(): Promise<Banner[]> {
    const query = `        
        SELECT * FROM banners WHERE active = true
      `;

    const res = await this.pool.query(query);
    return res.rows;
  }
}

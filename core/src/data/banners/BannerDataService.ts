import { Pool } from "pg";
import { getLogger } from "log4js";
import { DataAccessLayer } from "../dal";

interface Banner {
  id: number;
  type: string;
  text: "warning" | "error" | "info" | "success";
  active: boolean;
}

export class BannerDataService {
  constructor(private pool: Pool, private dal: DataAccessLayer) {}

  log = getLogger("BannerDataService");

  async listBanners(): Promise<Banner[]> {
    const query = `        
        SELECT * FROM banners WHERE active = true
      `;

    const res = await this.pool.query(query);
    return res.rows;
  }
}

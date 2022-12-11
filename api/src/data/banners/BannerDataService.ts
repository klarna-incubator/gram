import { Pool } from "pg";
import { getLogger } from "../../logger";
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
        SELECT * FROM banners
      `;

    const res = await this.pool.query(query);
    return res.rows;
  }
}

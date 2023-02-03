import { Pool } from "pg";
import { DataAccessLayer } from "../dal";
interface Banner {
    id: number;
    type: string;
    text: "warning" | "error" | "info" | "success";
    active: boolean;
}
export declare class BannerDataService {
    private pool;
    private dal;
    constructor(pool: Pool, dal: DataAccessLayer);
    log: import("log4js").Logger;
    listBanners(): Promise<Banner[]>;
}
export {};
//# sourceMappingURL=BannerDataService.d.ts.map
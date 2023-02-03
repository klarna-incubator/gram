import { Pool } from "pg";
import { DataAccessLayer } from "../dal";
import { SystemProperty } from "../system-property/types";
import { RequestContext } from "../providers/RequestContext";
interface SystemCompliance {
    SystemID: string;
    ApprovedModelId: string;
    ApprovedModelURL: string;
    ApprovedAt: string;
    PendingModelId: string;
    PendingModelURL: string;
    PendingStatus: string;
    PendingModelCreatedAt: string;
    PendingModelUpdatedAt: string;
    Properties: SystemProperty[];
}
interface SystemComplianceReport {
    Systems: SystemCompliance[];
    TotalSystems: number;
    Pages: number;
    Pagesize: number;
    Page: number;
}
export declare class ReportDataService {
    private pool;
    private dal;
    constructor(pool: Pool, dal: DataAccessLayer);
    log: import("log4js").Logger;
    listSystemCompliance(ctx: RequestContext, pagesize?: number, page?: number): Promise<SystemComplianceReport>;
}
export {};
//# sourceMappingURL=ReportDataService.d.ts.map
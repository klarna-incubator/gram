import { Pool } from "pg";
import { getLogger } from "log4js";
import { linkToModel } from "../../util/links";
import { DataAccessLayer } from "../dal";
import { SystemPropertyValue } from "../system-property/types";
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
  Properties: SystemPropertyValue[];
}

interface SystemComplianceReport {
  Systems: SystemCompliance[];
  TotalSystems: number;
  Pages: number;
  Pagesize: number;
  Page: number;
}

export class ReportDataService {
  constructor(private pool: Pool, private dal: DataAccessLayer) {}

  log = getLogger("ReportDataService");

  async listSystemCompliance(
    ctx: RequestContext,
    pagesize?: number,
    page?: number
  ): Promise<SystemComplianceReport> {
    const query = `        
        SELECT DISTINCT ON (m.system_id)
            m.system_id, 
            approved_models.model_id as approved_model_id, 
            approved_models.approved_at, 
            pending_models.model_id as pending_model_id,
            pending_models.status,
            pending_models.created_at,
            pending_models.updated_at
        FROM models m
        LEFT JOIN (
            SELECT DISTINCT ON (m1.system_id) m1.id as model_id, m1.system_id, r1.approved_at as approved_at
            FROM models m1
            INNER JOIN reviews r1 ON r1.model_id = m1.id
            WHERE r1.status = 'approved' AND r1.deleted_at IS NULL AND m1.deleted_at IS NULL
            ORDER BY m1.system_id, r1.approved_at DESC
        ) approved_models on approved_models.system_id = m.system_id
        LEFT JOIN (
            SELECT DISTINCT ON (m2.system_id) m2.id as model_id, m2.system_id, r2.status, r2.created_at, r2.updated_at
            FROM models m2
            INNER JOIN reviews r2 ON r2.model_id = m2.id
            WHERE r2.status IN ('requested', 'meeting-requested') AND r2.deleted_at IS NULL AND m2.deleted_at IS NULL
            ORDER BY m2.system_id, r2.created_at DESC
        ) pending_models on pending_models.system_id = m.system_id
        WHERE m.system_id IS NOT NULL and m.system_id != '00000000-0000-0000-0000-000000000000'
        ORDER BY m.system_id DESC
        ${
          pagesize && pagesize > 0
            ? `LIMIT ${pagesize} ${
                page && page > 0 ? `OFFSET ${(page - 1) * pagesize}` : ""
              }`
            : ""
        };
      `;

    const res = await this.pool.query(query);

    const count = (
      await this.pool.query("SELECT count(DISTINCT system_id) FROM models")
    ).rows[0].count;

    return {
      Systems: await Promise.all(
        res.rows.map(async (row) => {
          const hasPending = row.created_at > row.approved_at;
          return {
            SystemID: row.system_id,
            ApprovedModelId: row.approved_model_id,
            ApprovedModelURL: row.approved_model_id
              ? linkToModel(row.approved_model_id)
              : null,
            ApprovedAt: row.approved_at,
            PendingModelId: hasPending ? row.pending_model_id : null,
            PendingModelURL:
              hasPending && row.pending_model_id
                ? linkToModel(row.pending_model_id)
                : null,
            PendingModelUpdatedAt: hasPending ? row.updated_at : null,
            PendingStatus: hasPending ? row.status : null,
            PendingModelCreatedAt: hasPending ? row.created_at : null,
            Properties: await this.dal.sysPropHandler.contextualize(
              ctx,
              row.system_id,
              true
            ),
          } as SystemCompliance;
        })
      ),
      Page: page || 1,
      Pagesize: pagesize || count,
      Pages:
        Math.floor(count / (pagesize || count)) +
        (count % (pagesize || count) > 0 ? 1 : 0),
      TotalSystems: count,
    };
  }
}

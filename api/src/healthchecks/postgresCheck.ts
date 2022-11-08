import physical from "express-physical";
import { DataAccessLayer } from "../data/dal";
import { getLogger } from "../logger";

const log = getLogger("postgresCheck");

export async function postgresSimpleQueryCheck(dal: DataAccessLayer) {
  return async (done: any) => {
    const check: any = {
      name: "gram-api-postgres",
      actionable: true,
      healthy: true,
      dependentOn: "postgres",
      type: physical.type.EXTERNAL_DEPENDENCY,
    };

    try {
      await dal.pool.query("SELECT 1;");
    } catch (error: any) {
      log.error(error);
      check.healthy = false;
      check.message =
        "Postgres went down. Please check error log for more info";
      check.severity = physical.severity.CRITICAL;
    }

    done(physical.response(check));
  };
}

export async function postgresAvailableConnectionsCheck(dal: DataAccessLayer) {
  return async (done: any) => {
    const check: any = {
      name: "gram-api-postgres-available-connections",
      actionable: true,
      healthy: dal.pool.waitingCount === 0,
      dependentOn: "postgres",
      type: physical.type.EXTERNAL_DEPENDENCY,
      severity: physical.severity.WARNING,
      message:
        "The internal Postgres connection pool has been exhausted and clients are waiting. This means that queries are left hanging",
    };

    done(physical.response(check));
  };
}

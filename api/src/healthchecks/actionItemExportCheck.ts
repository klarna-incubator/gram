import physical from "express-physical";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import log4js from "log4js";

const log = log4js.getLogger("notificationsCheck");

export function actionItemExportCheck(dal: DataAccessLayer) {
  return async (done: any) => {
    const check: any = {
      name: "@gram/api-action-item-exports-failed",
      actionable: true,
      healthy: true,
      dependentOn: "postgres",
      type: physical.type.INTERNAL_DEPENDENCY,
    };

    try {
      const failed = await dal.actionItemHandler.countFailures();
      if (failed > 0) {
        check.healthy = false;
        check.message = `There are ${failed} action itames that failed to export. Check the database table: action_item_failed_exports.`;
        check.severity = physical.severity.WARNING;
      }
    } catch (error: any) {
      log.error(error);
      check.healthy = false;
      check.message =
        "Failed to check for failed action item exports. Please check error log for more info";
      check.severity = physical.severity.WARNING;
    }

    done(physical.response(check));
  };
}

import physical from "express-physical";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import pkg from "log4js";
const { getLogger } = pkg;

const log = getLogger("notificationsCheck");

export function notificationsFailedCheck(dal: DataAccessLayer) {
  return async (done: any) => {
    const check: any = {
      name: "@gram/api-notifications-failed",
      actionable: true,
      healthy: true,
      dependentOn: "postgres",
      type: physical.type.EXTERNAL_DEPENDENCY,
    };

    try {
      const failed = await dal.notificationService.countFailures();
      if (failed > 0) {
        check.healthy = false;
        check.message = `There are ${failed} notifications that failed on the notifications queue.`;
        check.severity = physical.severity.WARNING;
      }
    } catch (error: any) {
      log.error(error);
      check.healthy = false;
      check.message =
        "Failed to check for failed notifications. Please check error log for more info";
      check.severity = physical.severity.WARNING;
    }

    done(physical.response(check));
  };
}

export function notificationsStalledCheck(dal: DataAccessLayer) {
  return async (done: any) => {
    const check: any = {
      name: "@gram/api-notifications-stalled",
      actionable: true,
      healthy: true,
      dependentOn: "postgres",
      type: physical.type.INFRASTRUCTURE,
    };

    try {
      const stalled = await dal.notificationService.countStalled();
      if (stalled > 0) {
        check.healthy = false;
        check.message = `There are ${stalled} notifications that have stalled on the notifications queue.`;
        check.severity = physical.severity.WARNING;
      }
    } catch (error: any) {
      log.error(error);
      check.healthy = false;
      check.message =
        "Failed to check for stalled notifications. Please check error log for more info";
      check.severity = physical.severity.WARNING;
    }

    done(physical.response(check));
  };
}

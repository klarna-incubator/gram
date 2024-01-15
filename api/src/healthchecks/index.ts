import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import physical from "express-physical";
// import {
//   notificationsFailedCheck,
//   notificationsStalledCheck,
// } from "./notificationsCheck.js";
import { postgresSimpleQueryCheck } from "./postgresCheck.js";
import { selfCheck } from "./selfCheck.js";
import { actionItemExportCheck } from "./actionItemExportCheck.js";

export const createHealthChecks = (dal: DataAccessLayer) =>
  //TODO ability to extend with deployment specific healtchecks
  physical([
    selfCheck,
    postgresSimpleQueryCheck(dal),
    // postgresAvailableConnectionsCheck(dal), // Disabled, since it's not working as intended.
    actionItemExportCheck(dal),
    // Disabled for now, since they are too noisy.
    // notificationsFailedCheck(dal),
    // notificationsStalledCheck(dal),
  ]);

import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import physical from "express-physical";
// import {
//   notificationsFailedCheck,
//   notificationsStalledCheck,
// } from "./notificationsCheck.js";
import {
  postgresAvailableConnectionsCheck,
  postgresSimpleQueryCheck,
} from "./postgresCheck.js";
import { selfCheck } from "./selfCheck.js";

export const createHealthChecks = (dal: DataAccessLayer) =>
  //TODO ability to extend with deployment specific healtchecks
  physical([
    selfCheck,
    postgresSimpleQueryCheck(dal),
    postgresAvailableConnectionsCheck(dal),
    // Disabled for now, since they are too noisy.
    // notificationsFailedCheck(dal),
    // notificationsStalledCheck(dal),
  ]);

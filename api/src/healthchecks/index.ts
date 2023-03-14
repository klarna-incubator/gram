import { DataAccessLayer } from "@gram/core/dist/data/dal";
import physical from "express-physical";
// import {
//   notificationsFailedCheck,
//   notificationsStalledCheck,
// } from "./notificationsCheck";
import {
  postgresAvailableConnectionsCheck,
  postgresSimpleQueryCheck,
} from "./postgresCheck";
import { selfCheck } from "./selfCheck";

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

import physical from "express-physical";
import { DataAccessLayer } from "../data/dal";
import {
  notificationsFailedCheck,
  notificationsStalledCheck,
} from "./notificationsCheck";
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
    notificationsFailedCheck(dal),
    notificationsStalledCheck(dal),
  ]);

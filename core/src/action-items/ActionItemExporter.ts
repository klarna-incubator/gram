import { DataAccessLayer } from "../data/dal.js";
import Threat from "../data/threats/Threat.js";

export {
  ActionItemExportError,
  formatExportFailureCause,
} from "./ActionItemExportError.js";
export type { ActionItemExportFailure } from "./ActionItemExportError.js";

export interface ActionItemExporter {
  key: string;

  exportOnReviewApproved: boolean;

  export(dal: DataAccessLayer, actionItems: Threat[]): Promise<void>;
}

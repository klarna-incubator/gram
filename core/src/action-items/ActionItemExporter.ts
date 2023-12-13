import { DataAccessLayer } from "../data/dal.js";
import { ActionItem } from "../data/threats/ActionItem.js";

export interface ExportResult {
  Key: string;

  ThreatId: string;
  /**
   * The URL to the linked issue.
   */
  LinkedURL?: string;
}

export interface ActionItemExporter {
  key: string;

  onReviewApproved(
    dal: DataAccessLayer,
    actionItems: ActionItem[]
  ): Promise<ExportResult[]>;
}

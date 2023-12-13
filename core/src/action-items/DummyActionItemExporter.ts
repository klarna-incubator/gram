import { DataAccessLayer } from "../data/dal.js";
import { ActionItem } from "../data/threats/ActionItem.js";
import { ActionItemExporter, ExportResult } from "./ActionItemExporter.js";

export class DummyActionItemExporter implements ActionItemExporter {
  key: string = "dummy";

  async onReviewApproved(
    dal: DataAccessLayer,
    actionItems: ActionItem[]
  ): Promise<ExportResult[]> {
    return actionItems.map((actionItem) => ({
      Key: this.key,
      ThreatId: actionItem.threat.id!,
      LinkedURL: `dummy:${actionItem.threat.id!}`,
    }));
  }
}

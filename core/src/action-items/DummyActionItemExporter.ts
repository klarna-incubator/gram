import { DataAccessLayer } from "../data/dal.js";
import Threat from "../data/threats/Threat.js";
import { ActionItemExporter } from "./ActionItemExporter.js";

export class DummyActionItemExporter implements ActionItemExporter {
  key: string = "dummy";

  exportOnReviewApproved: boolean = true;

  async export(dal: DataAccessLayer, actionItems: Threat[]): Promise<void> {
    // It does nothing.
  }
}

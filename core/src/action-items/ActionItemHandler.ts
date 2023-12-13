import log4js from "log4js";
import { DataAccessLayer } from "../data/dal.js";
import { Review } from "../data/reviews/Review.js";
import { ActionItemExport } from "../data/threats/ActionItem.js";
import { ActionItemExporter, ExportResult } from "./ActionItemExporter.js";

const log = log4js.getLogger("ActionItemHandler");

export class ActionItemHandler {
  private exporters: ActionItemExporter[] = [];

  constructor(private dal: DataAccessLayer) {
    this.dal.reviewService.on("approved", ({ review }) => {
      this.onReviewApproved(review);
    });
  }

  attachExporter(exporter: ActionItemExporter) {
    this.exporters.push(exporter);
    log.info("Attached action item exporter ", exporter.key);
  }

  async onReviewApproved(review: Review) {
    if (this.exporters.length === 0) {
      log.debug("No exporters for action items. Skipping export");
    }

    return this.exportForModel(review.modelId);
  }

  // TODO: route to trigger this.
  async exportForModel(modelId: string) {
    const actionItems = await this.dal.threatService.listActionItems(modelId);
    log.info(`Found ${actionItems.length} action items to export`);

    const results: ExportResult[] = [];
    for (const exporter of this.exporters) {
      const result = await exporter.onReviewApproved(this.dal, actionItems);
      results.push(...result);
    }

    for (const result of results) {
      await this.dal.threatService.insertActionItemExport(
        new ActionItemExport(result.Key, result.ThreatId, result.LinkedURL!)
      );
      // What if exporters are removed (1) or the link is removed, i.e. not returned by the exporter (2)?
      // 1. Could be handled manually in the database (query for exporter_key)
      // 2. May need extra funcionality to remove the link. For now I'll leave it as is.
    }
    log.info(`Exported ${results.length} action items`);
  }
}

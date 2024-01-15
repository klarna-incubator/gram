import log4js from "log4js";
import { DataAccessLayer } from "../data/dal.js";
import { Review } from "../data/reviews/Review.js";
import { ActionItemExporter } from "./ActionItemExporter.js";
import EventEmitter from "events";

const log = log4js.getLogger("ActionItemHandler");

export class ActionItemHandler {
  public exporters: ActionItemExporter[] = [];

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
      return;
    }

    return this.exportForModel(review.modelId);
  }

  async exportForModel(modelId: string) {
    const actionItems = await this.dal.threatService.listActionItems(modelId);
    log.info(`Found ${actionItems.length} action items to export`);

    const promises = this.exporters
      .filter((exporter) => exporter.exportOnReviewApproved)
      .map((exporter) => {
        exporter.export(this.dal, actionItems);
        log.info(
          `Exported ${actionItems.length} action items to ${exporter.key}`
        );
      });

    await Promise.all(promises);
  }
}

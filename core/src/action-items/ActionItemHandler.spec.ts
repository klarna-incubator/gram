import { DataAccessLayer } from "../data/dal.js";
import { createPostgresPool } from "../data/postgres.js";
import { Review } from "../data/reviews/Review.js";
import Threat, { ThreatSeverity } from "../data/threats/Threat.js";
import { _deleteAllTheThings } from "../data/utils.js";
import { createSampleModel } from "../test-util/model.js";
import { ActionItemHandler } from "./ActionItemHandler.js";
import { DummyActionItemExporter } from "./DummyActionItemExporter.js";

class OtherDummyActionItemExporter extends DummyActionItemExporter {
  key = "other-dummy";
  url = "other";

  async export(dal: DataAccessLayer, actionItems: Threat[]): Promise<void> {}
}

class ErroringActionItemExporter extends DummyActionItemExporter {
  key = "errorer";

  async export(dal: DataAccessLayer, actionItems: Threat[]): Promise<void> {
    throw new Error("Erroring exporter");
  }
}

describe("ActionItemHandler implementation", () => {
  let dal: DataAccessLayer;
  let modelId: string;
  let threatId: string;
  let review: Review;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
  });

  beforeEach(async () => {
    await _deleteAllTheThings(dal);
    modelId = await createSampleModel(dal);

    const model = await dal.modelService.getById(modelId);

    threatId = await dal.threatService.create(
      new Threat(
        "title",
        "desc",
        modelId,
        model?.data.components[0].id!,
        "root"
      )
    );
    await dal.threatService.update(modelId, threatId, {
      severity: ThreatSeverity.High,
      isActionItem: true,
    });
    review = new Review(modelId, "root");
    await dal.reviewService.create(review);
  });

  it("should handle no exporters without issue", async () => {
    const handler = new ActionItemHandler(dal);
    await handler.onReviewApproved(review);
  });

  it("should replace existing action item exports", async () => {
    const handler = new ActionItemHandler(dal);
    handler.attachExporter(new DummyActionItemExporter());
    await handler.onReviewApproved(review);
  });

  it("should handle multiple exporters", async () => {
    const handler = new ActionItemHandler(dal);
    handler.attachExporter(new DummyActionItemExporter());
    handler.attachExporter(new OtherDummyActionItemExporter());
    await handler.onReviewApproved(review);
  });

  it("should handle errors in exporters", async () => {
    const handler = new ActionItemHandler(dal);
    handler.attachExporter(new ErroringActionItemExporter());
    const threat = await dal.threatService.getById(threatId);

    let threw = false;
    try {
      await handler.export("errorer", [threat!]);
    } catch (e) {
      console.log(e);
      threw = true;
    }
    expect(threw).toBe(true);

    const res = await dal.pool.query(
      "SELECT * FROM action_item_failed_exports"
    );
    expect(res.rows.length).toBe(1);
  });

  afterAll(async () => {
    await dal.pool.end();
  });
});

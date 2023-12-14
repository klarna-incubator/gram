import { randomUUID } from "crypto";
import { DataAccessLayer } from "../data/dal.js";
import Model from "../data/models/Model.js";
import { createPostgresPool } from "../data/postgres.js";
import { Review } from "../data/reviews/Review.js";
import Threat, { ThreatSeverity } from "../data/threats/Threat.js";
import { _deleteAllTheThings } from "../data/utils.js";
import { ActionItemHandler } from "./ActionItemHandler.js";
import { DummyActionItemExporter } from "./DummyActionItemExporter.js";
import { ActionItem } from "../data/threats/ActionItem.js";
import { ExportResult } from "./ActionItemExporter.js";
import { createSampleModel } from "../test-util/model.js";

class OtherDummyActionItemExporter extends DummyActionItemExporter {
  key = "other-dummy";
  url = "other";

  setUrl(url: string) {
    this.url = url;
  }

  async onReviewApproved(
    dal: DataAccessLayer,
    actionItems: ActionItem[]
  ): Promise<ExportResult[]> {
    return actionItems.map((actionItem) => ({
      Key: this.key,
      ThreatId: actionItem.threat.id!,
      LinkedURL: this.url,
    }));
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

  it("should create an action item export", async () => {
    const handler = new ActionItemHandler(dal);
    handler.attachExporter(new DummyActionItemExporter());
    await handler.onReviewApproved(review);
    const actionItems = await dal.threatService.listActionItems(modelId);
    expect(actionItems).toHaveLength(1);
    expect(actionItems[0].threat.id).toEqual(threatId);
    expect(actionItems[0].threat.severity).toEqual(ThreatSeverity.High);
    expect(actionItems[0].exports).toHaveLength(1);
    expect(actionItems[0].exports[0].exporterKey).toBe("dummy");
  });

  it("should replace existing action item exports", async () => {
    const handler = new ActionItemHandler(dal);
    handler.attachExporter(new DummyActionItemExporter());
    await handler.onReviewApproved(review);
    const actionItems = await dal.threatService.listActionItems(modelId);
    expect(actionItems).toHaveLength(1);
    expect(actionItems[0].threat.id).toEqual(threatId);
    expect(actionItems[0].threat.severity).toEqual(ThreatSeverity.High);
    expect(actionItems[0].exports).toHaveLength(1);
    expect(actionItems[0].exports[0].exporterKey).toBe("dummy");

    // trigger again
    await handler.onReviewApproved(review);
    expect(actionItems).toHaveLength(1);
    expect(actionItems[0].threat.id).toEqual(threatId);
    expect(actionItems[0].threat.severity).toEqual(ThreatSeverity.High);
    expect(actionItems[0].exports).toHaveLength(1);
    expect(actionItems[0].exports[0].exporterKey).toBe("dummy");
  });

  it("should handle multiple exporters", async () => {
    const handler = new ActionItemHandler(dal);
    handler.attachExporter(new DummyActionItemExporter());
    handler.attachExporter(new OtherDummyActionItemExporter());
    await handler.onReviewApproved(review);
    const actionItems = await dal.threatService.listActionItems(modelId);
    expect(actionItems).toHaveLength(1);
    expect(actionItems[0].threat.id).toEqual(threatId);
    expect(actionItems[0].threat.severity).toEqual(ThreatSeverity.High);
    expect(actionItems[0].exports).toHaveLength(2);
    expect(actionItems[0].exports[0].exporterKey).toBe("dummy");
    expect(actionItems[0].exports[1].exporterKey).toBe("other-dummy");
  });

  it("should handle multiple exporters + changed url", async () => {
    const handler = new ActionItemHandler(dal);
    handler.attachExporter(new DummyActionItemExporter());
    const other = new OtherDummyActionItemExporter();
    handler.attachExporter(other);
    await handler.onReviewApproved(review);
    const actionItems = await dal.threatService.listActionItems(modelId);
    expect(actionItems).toHaveLength(1);
    expect(actionItems[0].threat.id).toEqual(threatId);
    expect(actionItems[0].threat.severity).toEqual(ThreatSeverity.High);
    expect(actionItems[0].exports).toHaveLength(2);
    expect(actionItems[0].exports[0].exporterKey).toBe("dummy");
    expect(actionItems[0].exports[1].exporterKey).toBe("other-dummy");

    // change the url
    other.setUrl("changed");
    await handler.onReviewApproved(review);
    const actionItems2 = await dal.threatService.listActionItems(modelId);
    expect(actionItems2).toHaveLength(1);
    expect(actionItems2[0].threat.id).toEqual(threatId);
    expect(actionItems2[0].threat.severity).toEqual(ThreatSeverity.High);
    expect(actionItems2[0].exports).toHaveLength(2);
    expect(actionItems2[0].exports[0].exporterKey).toBe("dummy");
    expect(actionItems2[0].exports[1].exporterKey).toBe("other-dummy");
    expect(actionItems2[0].exports[1].linkedURL).toBe("changed");
  });

  it("should still keep action item exports on model import", async () => {
    const handler = new ActionItemHandler(dal);
    handler.attachExporter(new DummyActionItemExporter());
    const other = new OtherDummyActionItemExporter();
    handler.attachExporter(other);
    await handler.onReviewApproved(review);

    const actionItems = await dal.threatService.listActionItems(modelId);
    expect(actionItems).toHaveLength(1);
    expect(actionItems[0].threat.id).toEqual(threatId);
    expect(actionItems[0].threat.severity).toEqual(ThreatSeverity.High);
    expect(actionItems[0].exports).toHaveLength(2);
    expect(actionItems[0].exports[0].exporterKey).toBe("dummy");
    expect(actionItems[0].exports[1].exporterKey).toBe("other-dummy");

    const modelId2 = await dal.modelService.copy(
      modelId,
      new Model("other", "new", "root")
    );

    expect(modelId).not.toEqual(modelId2);
    expect(modelId).not.toBeNull();

    const threats = await dal.threatService.list(modelId2!);
    expect(threats).toHaveLength(1);

    const actionItems2 = await dal.threatService.listActionItems(modelId2!);
    expect(actionItems2).toHaveLength(1);
    expect(actionItems2[0].threat.id).not.toEqual(threatId); // Thread ID gets overwritten during import
    expect(actionItems2[0].threat.severity).toEqual(ThreatSeverity.High);
    expect(actionItems2[0].exports).toHaveLength(2);
    expect(actionItems2[0].exports[0].exporterKey).toBe("dummy");
    expect(actionItems2[0].exports[1].exporterKey).toBe("other-dummy");
  });

  afterAll(async () => {
    await dal.pool.end();
  });
});

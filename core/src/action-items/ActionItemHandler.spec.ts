import { DataAccessLayer } from "../data/dal.js";
import { createPostgresPool } from "../data/postgres.js";
import { Review } from "../data/reviews/Review.js";
import Threat, { ThreatSeverity } from "../data/threats/Threat.js";
import { _deleteAllTheThings } from "../data/utils.js";
import { createSampleModel } from "../test-util/model.js";
import { ActionItemExportError } from "./ActionItemExportError.js";
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
    expect(threw).toBe(false);

    const res = await dal.pool.query(
      "SELECT * FROM action_item_failed_exports"
    );
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].cause).toBe("Erroring exporter");
  });

  it("records only listed items for ActionItemExportError", async () => {
    const handler = new ActionItemHandler(dal);
    const failedThreat = await dal.threatService.getById(threatId);
    const skippedThreat = new Threat(
      "skipped",
      "desc",
      modelId,
      "unused-component",
      "root"
    );
    skippedThreat.id = "00000000-0000-0000-0000-000000000099";

    class PartialFailureExporter extends DummyActionItemExporter {
      key = "partial-errorer";
      async export(): Promise<void> {
        throw new ActionItemExportError([
          { actionItem: failedThreat!, cause: "create failed: boom" },
        ]);
      }
    }

    handler.attachExporter(new PartialFailureExporter());

    let threw = false;
    try {
      await handler.export("partial-errorer", [failedThreat!, skippedThreat]);
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);

    const res = await dal.pool.query(
      "SELECT threat_id, exporter, cause FROM action_item_failed_exports"
    );
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].threat_id).toBe(threatId);
    expect(res.rows[0].exporter).toBe("partial-errorer");
    expect(res.rows[0].cause).toBe("create failed: boom");
  });

  async function insertFailure(
    handler: ActionItemHandler,
    exporterKey: string,
    actionItem: Threat
  ) {
    await handler.trackFailedExports(
      { key: exporterKey } as DummyActionItemExporter,
      [{ actionItem, cause: "test" }]
    );
  }

  describe("countFailures", () => {
    it("counts all failures when no filters are provided", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      expect(await handler.countFailures()).toBe(2);
    });

    it("counts only failures matching exporter", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      expect(await handler.countFailures({ exporter: "dummy" })).toBe(1);
    });

    it("counts failures by createdAfter and createdBefore", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      await dal.pool.query(
        `UPDATE action_item_failed_exports
         SET created_at = NOW() - INTERVAL '2 days'
         WHERE exporter = 'dummy'`
      );

      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      expect(await handler.countFailures({ createdAfter: cutoff })).toBe(1);
      expect(await handler.countFailures({ createdBefore: cutoff })).toBe(1);
    });
  });

  describe("listFailures", () => {
    it("lists all failures when no filters are provided", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      const listed = await handler.listFailures();
      expect(listed).toHaveLength(2);
    });

    it("lists only failures matching exporter", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      const listed = await handler.listFailures({ exporter: "dummy" });
      expect(listed).toHaveLength(1);
      expect(listed[0].exporter).toBe("dummy");
    });

    it("lists only failures matching modelId", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      const otherModelId = await createSampleModel(dal);
      const otherModel = await dal.modelService.getById(otherModelId);
      const otherThreatId = await dal.threatService.create(
        new Threat(
          "other",
          "desc",
          otherModelId,
          otherModel?.data.components[0].id!,
          "root"
        )
      );
      const otherThreat = (await dal.threatService.getById(otherThreatId))!;

      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "dummy", otherThreat);

      const listed = await handler.listFailures({ modelId });
      expect(listed).toHaveLength(1);
      expect(listed[0].model_id).toBe(modelId);
    });

    it("lists only failures matching threatId", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      const model = await dal.modelService.getById(modelId);
      const otherThreatId = await dal.threatService.create(
        new Threat(
          "other",
          "desc",
          modelId,
          model?.data.components[0].id!,
          "root"
        )
      );
      const otherThreat = (await dal.threatService.getById(otherThreatId))!;

      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "dummy", otherThreat);

      const listed = await handler.listFailures({ threatId });
      expect(listed).toHaveLength(1);
      expect(listed[0].threat_id).toBe(threatId);
    });

    it("ANDs combined filters", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      const listed = await handler.listFailures({
        exporter: "dummy",
        modelId,
        threatId,
      });
      expect(listed).toHaveLength(1);
      expect(listed[0].exporter).toBe("dummy");
    });

    it("paginates with limit and offset", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);
      await insertFailure(handler, "third", threat);

      const firstPage = await handler.listFailures({ limit: 2, offset: 0 });
      expect(firstPage).toHaveLength(2);

      const secondPage = await handler.listFailures({ limit: 2, offset: 2 });
      expect(secondPage).toHaveLength(1);

      const ids = [...firstPage, ...secondPage].map((row) => row.id);
      expect(new Set(ids).size).toBe(3);
    });

    it("defaults to limit 10 and offset 0", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      for (let i = 0; i < 12; i++) {
        await insertFailure(handler, `exporter-${i}`, threat);
      }

      const listed = await handler.listFailures();
      expect(listed).toHaveLength(10);
    });

    it("lists failures by createdAfter and createdBefore", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      await dal.pool.query(
        `UPDATE action_item_failed_exports
         SET created_at = NOW() - INTERVAL '2 days'
         WHERE exporter = 'dummy'`
      );

      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const after = await handler.listFailures({ createdAfter: cutoff });
      expect(after).toHaveLength(1);
      expect(after[0].exporter).toBe("other-dummy");

      const before = await handler.listFailures({ createdBefore: cutoff });
      expect(before).toHaveLength(1);
      expect(before[0].exporter).toBe("dummy");
    });
  });

  describe("clearFailures", () => {
    it("clears all failures when no filters are provided", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      await handler.clearFailures();

      expect(await handler.countFailures()).toBe(0);
    });

    it("clears only failures matching exporter", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      await handler.clearFailures({ exporter: "dummy" });

      const remaining = await handler.listFailures();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].exporter).toBe("other-dummy");
    });

    it("clears only failures matching modelId", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      const otherModelId = await createSampleModel(dal);
      const otherModel = await dal.modelService.getById(otherModelId);
      const otherThreatId = await dal.threatService.create(
        new Threat(
          "other",
          "desc",
          otherModelId,
          otherModel?.data.components[0].id!,
          "root"
        )
      );
      const otherThreat = (await dal.threatService.getById(otherThreatId))!;

      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "dummy", otherThreat);

      await handler.clearFailures({ modelId });

      const remaining = await handler.listFailures();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].model_id).toBe(otherModelId);
    });

    it("clears only failures matching threatId", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      const model = await dal.modelService.getById(modelId);
      const otherThreatId = await dal.threatService.create(
        new Threat(
          "other",
          "desc",
          modelId,
          model?.data.components[0].id!,
          "root"
        )
      );
      const otherThreat = (await dal.threatService.getById(otherThreatId))!;

      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "dummy", otherThreat);

      await handler.clearFailures({ threatId });

      const remaining = await handler.listFailures();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].threat_id).toBe(otherThreatId);
    });

    it("ANDs combined filters", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      await handler.clearFailures({ exporter: "dummy", modelId, threatId });

      const remaining = await handler.listFailures();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].exporter).toBe("other-dummy");
    });

    it("clears failures by createdAfter and createdBefore", async () => {
      const handler = new ActionItemHandler(dal);
      const threat = (await dal.threatService.getById(threatId))!;
      await insertFailure(handler, "dummy", threat);
      await insertFailure(handler, "other-dummy", threat);

      await dal.pool.query(
        `UPDATE action_item_failed_exports
         SET created_at = NOW() - INTERVAL '2 days'
         WHERE exporter = 'dummy'`
      );

      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await handler.clearFailures({ createdBefore: cutoff });
      let remaining = await handler.listFailures();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].exporter).toBe("other-dummy");

      await handler.clearFailures({ createdAfter: cutoff });
      remaining = await handler.listFailures();
      expect(remaining).toHaveLength(0);
    });
  });

  afterAll(async () => {
    await dal.pool.end();
  });
});

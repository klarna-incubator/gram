import { jest } from "@jest/globals";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import Model from "@gram/core/dist/data/models/Model.js";
import Threat, { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import { randomUUID } from "crypto";
import request from "supertest";
import { createTestApp } from "../../../../../test-util/app.js";
import { sampleOwnedSystem } from "../../../../../test-util/sampleOwnedSystem.js";
import {
  sampleAdminToken,
  sampleUserToken,
} from "../../../../../test-util/sampleTokens.js";
import { sampleUser } from "../../../../../test-util/sampleUser.js";

const adminToken = await sampleAdminToken();
const userToken = await sampleUserToken();

const EXPORTER = "dummy"; // registered by the test config (DummyActionItemExporter)

describe("admin action-items endpoints", () => {
  let app: any;
  let dal: DataAccessLayer;
  let modelId: string;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    const model = new Model(sampleOwnedSystem.id, "v", sampleUser.sub);
    model.data = { components: [], dataFlows: [] };
    modelId = await dal.modelService.create(model);
  });

  async function actionItem(): Promise<string> {
    const t = new Threat("t", "d", modelId, randomUUID(), sampleUser.sub);
    const id = await dal.threatService.create(t);
    await dal.threatService.update(modelId, id, {
      isActionItem: true,
      severity: ThreatSeverity.High,
    });
    return id;
  }

  describe("GET /api/v1/admin/action-items", () => {
    it("401 unauthenticated", async () => {
      const res = await request(app).get("/api/v1/admin/action-items");
      expect(res.status).toBe(401);
    });

    it("403 for non-admin", async () => {
      const res = await request(app)
        .get("/api/v1/admin/action-items")
        .set("Authorization", userToken);
      expect(res.status).toBe(403);
    });

    it("200 for admin with envelope", async () => {
      await actionItem();
      const res = await request(app)
        .get("/api/v1/admin/action-items")
        .set("Authorization", adminToken);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("limit", 50);
      expect(res.body).toHaveProperty("offset", 0);
      expect(Array.isArray(res.body.actionItems)).toBe(true);
    });

    it("400 for unknown exporterKey", async () => {
      const res = await request(app)
        .get("/api/v1/admin/action-items?exporterKey=nope")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
    });

    it("filters by severity server-side", async () => {
      const highId = await actionItem(); // actionItem() sets High
      const lowId = await actionItem();
      await dal.threatService.update(modelId, lowId, {
        severity: ThreatSeverity.Low,
      });

      const res = await request(app)
        .get(
          "/api/v1/admin/action-items?severity=medium&severity=high&severity=critical"
        )
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      const ids = res.body.actionItems.map((a: any) => a.id);
      expect(ids).toContain(highId);
      expect(ids).not.toContain(lowId);
    });

    it("400 for invalid severity", async () => {
      const res = await request(app)
        .get("/api/v1/admin/action-items?severity=bogus")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/admin/action-items/export", () => {
    const post = (body: any, token = adminToken) =>
      request(app)
        .post("/api/v1/admin/action-items/export")
        .set("Authorization", token)
        .send(body);

    it("401 unauthenticated", async () => {
      const res = await request(app)
        .post("/api/v1/admin/action-items/export")
        .send({ exporterKey: EXPORTER, threatIds: [randomUUID()] });
      expect(res.status).toBe(401);
    });

    it("403 for non-admin", async () => {
      const res = await post(
        { exporterKey: EXPORTER, threatIds: [randomUUID()] },
        userToken
      );
      expect(res.status).toBe(403);
    });

    it("400 for unknown exporterKey", async () => {
      const res = await post({
        exporterKey: "nope",
        threatIds: [randomUUID()],
      });
      expect(res.status).toBe(400);
    });

    it("400 for empty batch", async () => {
      const res = await post({ exporterKey: EXPORTER, threatIds: [] });
      expect(res.status).toBe(400);
    });

    it("400 for oversized batch", async () => {
      const threatIds = Array.from({ length: 101 }, () => randomUUID());
      const res = await post({ exporterKey: EXPORTER, threatIds });
      expect(res.status).toBe(400);
    });

    it("partitions notFound / notAnActionItem and keeps the summary invariant", async () => {
      const ai = await actionItem();
      const plain = await dal.threatService.create(
        new Threat("p", "d", modelId, randomUUID(), sampleUser.sub)
      );
      const missing = randomUUID();

      const res = await post({
        exporterKey: EXPORTER,
        threatIds: [ai, plain, missing, ai], // duplicate ai → deduped
      });

      expect(res.status).toBe(200);
      const { requested, summary, results } = res.body;
      expect(requested).toBe(3); // deduped
      const sum = Object.values(summary).reduce(
        (a: number, b: any) => a + b,
        0
      );
      expect(sum).toBe(requested);
      expect(results.length).toBe(requested);
      const byId = Object.fromEntries(
        results.map((r: any) => [r.threatId, r.outcome])
      );
      expect(byId[missing]).toBe("notFound");
      expect(byId[plain]).toBe("notAnActionItem");
      // dummy exporter is a no-op → eligible item has no link → notExported
      expect(byId[ai]).toBe("notExported");
    });

    it("classifies a newly linked item as exported (link-diff after)", async () => {
      const ai = await actionItem();
      jest
        .spyOn(dal.actionItemHandler, "export")
        .mockImplementation(async (key, items) => {
          for (const t of items) {
            await dal.linkService.insertLink(
              LinkObjectType.Threat,
              t.id!,
              "l",
              "https://ticket",
              "",
              key
            );
          }
        });

      const res = await post({ exporterKey: EXPORTER, threatIds: [ai] });
      expect(res.status).toBe(200);
      expect(res.body.summary.exported).toBe(1);
      expect(res.body.results[0]).toMatchObject({
        threatId: ai,
        outcome: "exported",
        link: "https://ticket",
      });
    });

    it("classifies a pre-linked item as alreadyExported (link-diff before)", async () => {
      const ai = await actionItem();
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        ai,
        "l",
        "https://existing",
        "",
        EXPORTER
      );
      jest
        .spyOn(dal.actionItemHandler, "export")
        .mockImplementation(async () => {});

      const res = await post({ exporterKey: EXPORTER, threatIds: [ai] });
      expect(res.status).toBe(200);
      expect(res.body.summary.alreadyExported).toBe(1);
      expect(res.body.results[0].outcome).toBe("alreadyExported");
    });
  });
});

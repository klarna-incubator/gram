import { randomUUID } from "crypto";
import { DataAccessLayer } from "../dal.js";
import { LinkObjectType } from "../links/Link.js";
import Model from "../models/Model.js";
import { createPostgresPool } from "../postgres.js";
import { _deleteAllTheThings } from "../utils.js";
import Threat, { ThreatSeverity } from "./Threat.js";
import { ThreatDataService } from "./ThreatDataService.js";

describe("Admin action item queries", () => {
  let data: ThreatDataService;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    data = dal.threatService;
  });

  beforeEach(async () => {
    await _deleteAllTheThings(dal);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  async function createModel(systemId: string): Promise<string> {
    const model = new Model(systemId, "v", "root");
    model.data = { components: [], dataFlows: [] };
    return await dal.modelService.create(model);
  }

  async function createActionItem(
    modelId: string,
    isActionItem = true
  ): Promise<Threat> {
    const t = new Threat("t", "d", modelId, randomUUID(), "creator");
    t.id = await data.create(t);
    if (isActionItem) {
      await data.update(modelId, t.id!, {
        isActionItem: true,
        severity: ThreatSeverity.High,
      });
    }
    return t;
  }

  async function approveReview(modelId: string, approvedAt: string) {
    await dal.pool.query(
      `INSERT INTO reviews (model_id, status, approved_at) VALUES ($1, 'approved', $2)`,
      [modelId, approvedAt]
    );
  }

  const baseFilter = {
    limit: 50,
    offset: 0,
  };

  describe("listByIds", () => {
    it("returns [] for empty input", async () => {
      expect(await data.listByIds([])).toEqual([]);
    });

    it("returns non-deleted threats by id with is_action_item", async () => {
      const modelId = await createModel("sys-a");
      const ai = await createActionItem(modelId, true);
      const plain = await createActionItem(modelId, false);

      const rows = await data.listByIds([ai.id!, plain.id!]);
      const byId = new Map(rows.map((r) => [r.id, r]));
      expect(rows.length).toBe(2);
      expect(byId.get(ai.id!)?.isActionItem).toBe(true);
      expect(byId.get(plain.id!)?.isActionItem).toBe(false);
    });

    it("excludes deleted threats", async () => {
      const modelId = await createModel("sys-a");
      const ai = await createActionItem(modelId);
      await data.delete(modelId, ai.id!);
      expect(await data.listByIds([ai.id!])).toEqual([]);
    });
  });

  describe("listActionItemsFiltered", () => {
    it("returns only action items, with total", async () => {
      const modelId = await createModel("sys-a");
      await createActionItem(modelId, true);
      await createActionItem(modelId, false); // regular threat, excluded

      const { total, items } = await data.listActionItemsFiltered(baseFilter);
      expect(total).toBe(1);
      expect(items.length).toBe(1);
      expect(items[0].systemId).toBe("sys-a");
      expect(items[0].threat.isActionItem).toBe(true);
    });

    it("filters by systemId", async () => {
      const a = await createModel("sys-a");
      const b = await createModel("sys-b");
      await createActionItem(a);
      await createActionItem(b);

      const { items } = await data.listActionItemsFiltered({
        ...baseFilter,
        systemIds: ["sys-a"],
      });
      expect(items.length).toBe(1);
      expect(items[0].systemId).toBe("sys-a");
    });

    it("marks exported when an exporter link exists, with link urls", async () => {
      const modelId = await createModel("sys-a");
      const ai = await createActionItem(modelId);
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        ai.id!,
        "label",
        "https://wb/Q1",
        "",
        "wikibase"
      );

      const { items } = await data.listActionItemsFiltered(baseFilter);
      expect(items[0].exported).toBe(true);
      expect(items[0].exportLinks).toHaveLength(1);
      expect(items[0].exportLinks[0].url).toBe("https://wb/Q1");
    });

    it("counts a user-added link as exported (created_by is unreliable)", async () => {
      const modelId = await createModel("sys-a");
      const ai = await createActionItem(modelId);
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        ai.id!,
        "label",
        "https://jira.com/browse/ABC-1",
        "",
        "alice@klarna.com" // user sub, not an exporter key
      );

      const { items } = await data.listActionItemsFiltered(baseFilter);
      expect(items[0].exported).toBe(true);
      expect(items[0].exportLinks).toHaveLength(1);
      expect(items[0].exportLinks[0].url).toBe("https://jira.com/browse/ABC-1");
    });

    it("counts a link from a removed exporter as exported", async () => {
      const modelId = await createModel("sys-a");
      const ai = await createActionItem(modelId);
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        ai.id!,
        "label",
        "https://old/Q1",
        "",
        "removed-exporter" // key no longer registered
      );

      const { items } = await data.listActionItemsFiltered(baseFilter);
      expect(items[0].exported).toBe(true);
      expect(items[0].exportLinks).toHaveLength(1);
    });

    it("treats an item with no links as not exported", async () => {
      const modelId = await createModel("sys-a");
      await createActionItem(modelId);

      const { items } = await data.listActionItemsFiltered(baseFilter);
      expect(items[0].exported).toBe(false);
      expect(items[0].exportLinks).toEqual([]);
    });

    it("does not multiply rows when a threat has multiple exporter links", async () => {
      const modelId = await createModel("sys-a");
      const ai = await createActionItem(modelId);
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        ai.id!,
        "l1",
        "https://wb/Q1",
        "",
        "wikibase"
      );
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        ai.id!,
        "l2",
        "https://wb/Q2",
        "",
        "wikibase"
      );

      const { total, items } = await data.listActionItemsFiltered(baseFilter);
      expect(total).toBe(1);
      expect(items.length).toBe(1);
      expect(items[0].exportLinks).toHaveLength(2);
    });

    it("filters by exportStatus exported / not-exported", async () => {
      const modelId = await createModel("sys-a");
      const exported = await createActionItem(modelId);
      await createActionItem(modelId); // not exported
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        exported.id!,
        "l",
        "https://wb/Q1",
        "",
        "wikibase"
      );

      const onlyExported = await data.listActionItemsFiltered({
        ...baseFilter,
        exportStatus: "exported",
      });
      expect(onlyExported.items.map((i) => i.threat.id)).toEqual([exported.id]);

      const onlyMissing = await data.listActionItemsFiltered({
        ...baseFilter,
        exportStatus: "not-exported",
      });
      expect(onlyMissing.items.map((i) => i.threat.id)).not.toContain(
        exported.id
      );
      expect(onlyMissing.items).toHaveLength(1);
    });

    async function actionItemWithLink(
      modelId: string,
      url: string,
      createdBy = "alice@klarna.com"
    ): Promise<Threat> {
      const ai = await createActionItem(modelId);
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        ai.id!,
        "l",
        url,
        "",
        createdBy
      );
      return ai;
    }

    it("exportDomain matches the exact host and subdomains, not look-alikes", async () => {
      const modelId = await createModel("sys-a");
      const exact = await actionItemWithLink(
        modelId,
        "https://jira.com/browse/ABC-1"
      );
      const sub = await actionItemWithLink(
        modelId,
        "https://team.jira.com/browse/ABC-2"
      );
      await actionItemWithLink(modelId, "https://notjira.com/x");
      await actionItemWithLink(modelId, "https://jira.com.evil/x");

      const { items } = await data.listActionItemsFiltered({
        ...baseFilter,
        exportDomain: ["jira.com"],
        exportStatus: "exported",
      });
      expect(items.map((i) => i.threat.id).sort()).toEqual(
        [exact.id, sub.id].sort()
      );
    });

    it("exportDomain not-exported returns items without a matching-host link", async () => {
      const modelId = await createModel("sys-a");
      await actionItemWithLink(modelId, "https://jira.com/browse/ABC-1");
      const other = await actionItemWithLink(modelId, "https://example.com/x");
      const none = await createActionItem(modelId);

      const { items } = await data.listActionItemsFiltered({
        ...baseFilter,
        exportDomain: ["jira.com"],
        exportStatus: "not-exported",
      });
      expect(items.map((i) => i.threat.id).sort()).toEqual(
        [other.id, none.id].sort()
      );
    });

    it("exportLinks returns ALL links even when exportDomain is set", async () => {
      const modelId = await createModel("sys-a");
      const ai = await createActionItem(modelId);
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        ai.id!,
        "l1",
        "https://jira.com/browse/ABC-1",
        "",
        "alice@klarna.com"
      );
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        ai.id!,
        "l2",
        "https://example.com/x",
        "",
        "alice@klarna.com"
      );

      const { items } = await data.listActionItemsFiltered({
        ...baseFilter,
        exportDomain: ["jira.com"],
      });
      expect(items).toHaveLength(1);
      expect(items[0].exported).toBe(true);
      expect(items[0].exportLinks.map((l) => l.url).sort()).toEqual(
        ["https://example.com/x", "https://jira.com/browse/ABC-1"].sort()
      );
    });

    it("matches a domain literally (LIKE wildcards are not special) and handles userinfo/port", async () => {
      const modelId = await createModel("sys-a");
      const withPort = await actionItemWithLink(
        modelId,
        "https://user@jira.com:443/x"
      );
      // A literal "%" in the domain must not act as a wildcard host match.
      await actionItemWithLink(modelId, "https://jira.com/x");

      const portMatch = await data.listActionItemsFiltered({
        ...baseFilter,
        exportDomain: ["jira.com"],
        exportStatus: "exported",
      });
      expect(portMatch.items.map((i) => i.threat.id)).toContain(withPort.id);

      const wildcard = await data.listActionItemsFiltered({
        ...baseFilter,
        exportDomain: ["j%.com"],
        exportStatus: "exported",
      });
      expect(wildcard.items).toHaveLength(0);
    });

    it("matches a link host against ANY of several exportDomains", async () => {
      const modelId = await createModel("sys-a");
      const jira = await actionItemWithLink(
        modelId,
        "https://jira.com/browse/ABC-1"
      );
      const github = await actionItemWithLink(
        modelId,
        "https://sub.github.com/x"
      );
      await actionItemWithLink(modelId, "https://example.com/x");

      const { items } = await data.listActionItemsFiltered({
        ...baseFilter,
        exportDomain: ["jira.com", "github.com"],
        exportStatus: "exported",
      });
      expect(items.map((i) => i.threat.id).sort()).toEqual(
        [jira.id, github.id].sort()
      );
    });

    it("filters by severity (one or many)", async () => {
      const modelId = await createModel("sys-a");
      const high = await createActionItem(modelId); // createActionItem sets High
      const low = await createActionItem(modelId);
      await data.update(modelId, low.id!, { severity: ThreatSeverity.Low });

      const { items } = await data.listActionItemsFiltered({
        ...baseFilter,
        severities: [
          ThreatSeverity.Medium,
          ThreatSeverity.High,
          ThreatSeverity.Critical,
        ],
      });
      expect(items.map((i) => i.threat.id)).toEqual([high.id]);
    });

    it("reviewApproved range excludes items whose model has no approved review", async () => {
      const withReview = await createModel("sys-a");
      const without = await createModel("sys-b");
      const aiWith = await createActionItem(withReview);
      await createActionItem(without);
      await approveReview(withReview, "2026-06-10T00:00:00Z");

      const { items } = await data.listActionItemsFiltered({
        ...baseFilter,
        reviewApprovedFrom: "2026-06-01T00:00:00Z",
        reviewApprovedTo: "2026-06-30T00:00:00Z",
      });
      expect(items.map((i) => i.threat.id)).toEqual([aiWith.id]);
      expect(items[0].reviewApprovedAt).toBeGreaterThan(0);
    });
  });

  describe("listLinksForObjects", () => {
    it("returns [] for empty input", async () => {
      expect(
        await dal.linkService.listLinksForObjects(LinkObjectType.Threat, [])
      ).toEqual([]);
    });

    it("batches links across objects and scopes by createdBy", async () => {
      const modelId = await createModel("sys-a");
      const a = await createActionItem(modelId);
      const b = await createActionItem(modelId);
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        a.id!,
        "l",
        "url-a",
        "",
        "wikibase"
      );
      await dal.linkService.insertLink(
        LinkObjectType.Threat,
        b.id!,
        "l",
        "url-b",
        "",
        "alice@klarna.com"
      );

      const all = await dal.linkService.listLinksForObjects(
        LinkObjectType.Threat,
        [a.id!, b.id!]
      );
      expect(all.length).toBe(2);

      const scoped = await dal.linkService.listLinksForObjects(
        LinkObjectType.Threat,
        [a.id!, b.id!],
        "wikibase"
      );
      expect(scoped.map((l) => l.objectId)).toEqual([a.id]);
    });
  });
});

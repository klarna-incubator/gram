import { randomUUID } from "crypto";
import pg from "pg";
import Control from "../controls/Control.js";
import { DataAccessLayer } from "../dal.js";
import Mitigation from "../mitigations/Mitigation.js";
import Model from "../models/Model.js";
import { createPostgresPool } from "../postgres.js";
import { _deleteAllTheThings } from "../utils.js";
import Threat, { ThreatSeverity } from "./Threat.js";
import { ThreatDataService } from "./ThreatDataService.js";

describe("ThreatDataService implementation", () => {
  let data: ThreatDataService;
  let dal: DataAccessLayer;
  let pool: pg.Pool;
  let model: Model;

  beforeAll(async () => {
    pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    data = dal.threatService;
    await _deleteAllTheThings(pool);
  });

  beforeEach(async () => {
    await _deleteAllTheThings(pool);
    model = new Model("some-system-id", "some-version", "root");
    model.data = { components: [], dataFlows: [] };
    model.id = await dal.modelService.create(model);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getById threat", () => {
    it("should return a valid threat", async () => {
      const componentId = randomUUID();
      const threat = new Threat(
        "title",
        "description",
        model.id!,
        componentId,
        "createdBy"
      );
      threat.id = await data.create(threat);

      const fetched = await data.getById(threat.id!);

      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.id).toBe(threat.id);
      expect(fetched?.modelId).toBe(model.id!);
      expect(fetched?.componentId).toBe(componentId);
      expect(fetched?.title).toBe("title");
      expect(fetched?.createdBy).toBe("createdBy");
      expect(fetched?.suggestionId).toBe(undefined);
      expect(fetched?.description).toBe("description");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });

    it("should return null value by default", async () => {
      const threat = await data.getById(randomUUID());
      expect(threat).toBe(null);
    });
  });

  describe("list threats", () => {
    it("should return threats of model", async () => {
      const componentId = randomUUID();
      const threat1 = new Threat(
        "title1",
        "description1",
        model.id!,
        componentId,
        "createdBy1"
      );
      threat1.id = await data.create(threat1);

      const threat2 = new Threat(
        "title2",
        "description2",
        model.id!,
        componentId,
        "createdBy2"
      );
      threat2.id = await data.create(threat2);

      const threats = await data.list(model.id!);

      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(threats.length).toEqual(2);
      expect(threats[0].toJSON()).toBeDefined();
      expect(threats[0].id).toBe(threat2.id);
      expect(threats[0].modelId).toBe(model.id!);
      expect(threats[0].componentId).toBe(componentId);
      expect(threats[0].title).toBe("title2");
      expect(threats[0].createdBy).toBe("createdBy2");
      expect(threats[0].suggestionId).toBe(undefined);
      expect(threats[0].description).toBe("description2");
      expect(threats[0].createdAt).toBeLessThan(Date.now() + 1000);
      expect(threats[0].createdAt).toBeGreaterThan(yesterday.getTime());
      expect(threats[0].updatedAt).toBeLessThan(Date.now() + 1000);
      expect(threats[0].updatedAt).toBeGreaterThan(yesterday.getTime());

      expect(threats[1].toJSON()).toBeDefined();
      expect(threats[1].id).toBe(threat1.id);
      expect(threats[1].modelId).toBe(model.id!);
      expect(threats[1].componentId).toBe(componentId);
      expect(threats[1].title).toBe("title1");
      expect(threats[1].createdBy).toBe("createdBy1");
      expect(threats[1].suggestionId).toBe(undefined);
      expect(threats[1].description).toBe("description1");
      expect(threats[1].createdAt).toBeLessThan(Date.now() + 1000);
      expect(threats[1].createdAt).toBeGreaterThan(yesterday.getTime());
      expect(threats[1].updatedAt).toBeLessThan(Date.now() + 1000);
      expect(threats[1].updatedAt).toBeGreaterThan(yesterday.getTime());
    });

    it("should return null value by default", async () => {
      const threats = await data.list(randomUUID());
      expect(threats).toEqual([]);
    });
  });

  describe("list action items", () => {
    it("should return threats of model that are marked as action items", async () => {
      const componentId = randomUUID();
      const threat1 = new Threat(
        "title1",
        "description1",
        model.id!,
        componentId,
        "createdBy1"
      );
      threat1.id = await data.create(threat1);

      const threat2 = new Threat(
        "title2",
        "description2",
        model.id!,
        componentId,
        "createdBy2"
      );
      threat2.id = await data.create(threat2);
      await data.update(model.id!, threat2.id!, { isActionItem: true });

      const threats = await data.listActionItems(model.id!);

      expect(threats.length).toEqual(1);

      expect(threats[0].toJSON()).toBeDefined();
      expect(threats[0].id).toBe(threat2.id);
    });

    it("should return null value by default", async () => {
      const threats = await data.list(randomUUID());
      expect(threats).toEqual([]);
    });
  });

  describe("delete threat", () => {
    it("should return false on deleting non-existent threat", async () => {
      const res = await data.delete(model.id!, randomUUID());
      expect(res).toBeFalsy();
    });
    it("should not delete other rows", async () => {
      const componentId = randomUUID();
      const threat = new Threat(
        "title",
        "description",
        model.id!,
        componentId,
        "createdBy"
      );
      threat.id = await data.create(threat);
      const res = await data.delete(model.id!, randomUUID());
      expect(res).toBeFalsy();
      const fetched = await data.getById(threat.id!);
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched).toBeTruthy();
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.id).toBe(threat.id);
      expect(fetched?.modelId).toBe(model.id!);
      expect(fetched?.componentId).toBe(componentId);
      expect(fetched?.title).toBe("title");
      expect(fetched?.createdBy).toBe("createdBy");
      expect(fetched?.suggestionId).toBe(undefined);
      expect(fetched?.description).toBe("description");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });
    it("should not be able to fetch deleted row", async () => {
      const componentId = randomUUID();
      const threat = new Threat(
        "title",
        "description",
        model.id!,
        componentId,
        "createdBy"
      );
      threat.id = await data.create(threat);
      const res = await data.delete(model.id!, threat.id!);
      expect(res).toBeTruthy();
      const fetched = await data.getById(threat.id!);
      expect(fetched).toBeFalsy();
    });
    it("should delete associated mitigations", async () => {
      const componentId = randomUUID();
      const control = new Control(
        "title",
        "description",
        true,
        model.id!,
        componentId,
        "createdBy"
      );
      control.id = await dal.controlService.create(control);

      const threat2 = new Threat(
        "title2",
        "description2",
        model.id!,
        componentId,
        "createdBy2"
      );
      threat2.id = await data.create(threat2);

      const threat = new Threat(
        "title2threat",
        "description2threat",
        model.id!,
        componentId,
        "createdBy2threat"
      );
      threat.id = await data.create(threat);

      const mitigation = new Mitigation(
        threat.id!,
        control.id!,
        "createdBy2threat1"
      );
      const res1 = await dal.mitigationService.create(mitigation);
      expect(res1).toBeTruthy();
      const { threatId, controlId } = res1
        ? res1
        : { threatId: "", controlId: "" };

      const mitigation2 = new Mitigation(
        threat2.id!,
        control.id!,
        "createdBy2threat3"
      );
      const res2 = await dal.mitigationService.create(mitigation2);
      expect(res2).toBeTruthy();
      const { threatId: threat2Id } = res2 ? res2 : { threatId: "" };

      const mitigationRes = await dal.mitigationService.getById(
        threatId,
        controlId
      );
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(mitigationRes!.toJSON()).toBeDefined();
      expect(mitigationRes!.threatId).toBe(threatId);
      expect(mitigationRes!.controlId).toBe(controlId);
      expect(mitigationRes!.createdBy).toBe("createdBy2threat1");
      expect(mitigationRes!.createdAt).toBeLessThan(Date.now() + 1000);
      expect(mitigationRes!.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(mitigationRes!.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(mitigationRes!.updatedAt).toBeGreaterThan(yesterday.getTime());

      const res = await data.delete(model.id!, threatId);
      expect(res).toBeTruthy();

      const fetchDeleted = await dal.mitigationService.getById(
        threatId,
        controlId
      );
      expect(fetchDeleted).toBe(null);

      const fetched = await dal.mitigationService.getById(threat2Id, controlId);
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.threatId).toBe(threat2Id);
      expect(fetched?.controlId).toBe(controlId);
      expect(fetched?.createdBy).toBe("createdBy2threat3");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });
  });

  describe("update threat", () => {
    it("should update threat", async () => {
      const componentId = randomUUID();
      const threat = new Threat(
        "title",
        "description",
        model.id!,
        componentId,
        "createdBy"
      );
      threat.id = await data.create(threat);

      const fetched = await data.getById(threat.id!);
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.id).toBe(threat.id);
      expect(fetched?.modelId).toBe(model.id!);
      expect(fetched?.componentId).toBe(componentId);
      expect(fetched?.title).toBe("title");
      expect(fetched?.createdBy).toBe("createdBy");
      expect(fetched?.suggestionId).toBe(undefined);
      expect(fetched?.description).toBe("description");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());

      const updated = await data.update(model.id!, threat.id!, {
        title: "newtitle",
        description: "baddesc",
        severity: ThreatSeverity.High,
      });
      expect(updated).toBeInstanceOf(Threat);
      if (updated instanceof Threat) {
        expect(updated!.toJSON()).toBeDefined();
        expect(updated!.id).toBe(threat.id);
        expect(updated!.modelId).toBe(model.id!);
        expect(updated!.componentId).toBe(componentId);
        expect(updated!.title).toBe("newtitle");
        expect(updated!.createdBy).toBe("createdBy");
        expect(updated!.suggestionId).toBe(undefined);
        expect(updated!.description).toBe("baddesc");
        expect(updated!.severity).toBe(ThreatSeverity.High);
      }
    });
  });
});

import { randomUUID } from "crypto";
import { Pool } from "pg";
import Control from "../controls/Control";
import { DataAccessLayer } from "../dal";
import Model from "../models/Model";
import { createPostgresPool } from "../postgres";
import Threat from "../threats/Threat";
import { _deleteAllTheThings } from "../utils";
import Mitigation from "./Mitigation";
import { MitigationDataService } from "./MitigationDataService";

describe("MitigationDataService implementation", () => {
  let data: MitigationDataService;
  let dal: DataAccessLayer;
  let pool: Pool;
  let model: Model;

  beforeAll(async () => {
    pool = await createPostgresPool();
    data = new MitigationDataService(pool);
    dal = new DataAccessLayer(pool);
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

  describe("getById mitigation", () => {
    it("should return a valid mitigation", async () => {
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

      const threat = new Threat(
        "title",
        "description",
        model.id!,
        componentId,
        "createdBy"
      );
      threat.id = await dal.threatService.create(threat);

      const mitigation = new Mitigation(threat.id!, control.id!, "creator");
      const res1 = await data.create(mitigation);
      expect(res1).toBeTruthy();
      const { threatId, controlId } = res1
        ? res1
        : { threatId: "", controlId: "" };

      const fetched = await data.getById(threatId, controlId);
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.threatId).toBe(threat.id);
      expect(fetched?.controlId).toBe(control.id);
      expect(fetched?.createdBy).toBe("creator");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });

    it("should return null value by default", async () => {
      const mitigation = await data.getById(randomUUID(), randomUUID());
      expect(mitigation).toBe(null);
    });
  });

  describe("list mitigations", () => {
    it("should return a list of mitigations", async () => {
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

      const control2 = new Control(
        "title2",
        "description2",
        false,
        model.id!,
        componentId,
        "createdBy2"
      );
      control2.id = await dal.controlService.create(control2);

      const threat = new Threat(
        "title",
        "description",
        model.id!,
        componentId,
        "createdBy"
      );
      threat.id = await dal.threatService.create(threat);

      const mitigation = new Mitigation(threat.id!, control.id!, "creator");
      const res1 = await data.create(mitigation);
      expect(res1).toBeTruthy();
      const { threatId, controlId } = res1
        ? res1
        : { threatId: "", controlId: "" };

      const mitigation2 = new Mitigation(threat.id!, control2.id!, "creator1");
      const res2 = await data.create(mitigation2);
      expect(res2).toBeTruthy();
      const { controlId: control2Id } = res2 ? res2 : { controlId: "" };

      const mitigations = await data.list(model.id!);

      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(mitigations.length).toEqual(2);
      expect(mitigations[0].toJSON()).toBeDefined();
      expect(mitigations[0].threatId).toBe(threatId);
      expect(mitigations[0].controlId).toBe(controlId);
      expect(mitigations[0].createdBy).toBe("creator");
      expect(mitigations[0].createdAt).toBeLessThan(Date.now() + 1000);
      expect(mitigations[0].createdAt).toBeGreaterThan(yesterday.getTime());
      expect(mitigations[0].updatedAt).toBeLessThan(Date.now() + 1000);
      expect(mitigations[0].updatedAt).toBeGreaterThan(yesterday.getTime());

      expect(mitigations[1].toJSON()).toBeDefined();
      expect(mitigations[1].threatId).toBe(threatId);
      expect(mitigations[1].controlId).toBe(control2Id);
      expect(mitigations[1].createdBy).toBe("creator1");
      expect(mitigations[1].createdAt).toBeLessThan(Date.now() + 1000);
      expect(mitigations[1].createdAt).toBeGreaterThan(yesterday.getTime());
      expect(mitigations[1].updatedAt).toBeLessThan(Date.now() + 1000);
      expect(mitigations[1].updatedAt).toBeGreaterThan(yesterday.getTime());
    });

    it("should return empty list by default", async () => {
      const mitigations = await data.list(randomUUID());
      expect(mitigations).toEqual([]);
    });
  });

  describe("delete mitigation", () => {
    it("should return false on deleting non-existent mitigation", async () => {
      const res = await data.delete(randomUUID(), randomUUID());
      expect(res).toBeFalsy();
    });
    it("should not delete other rows", async () => {
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

      const threat = new Threat(
        "title",
        "description",
        model.id!,
        componentId,
        "createdBy"
      );
      threat.id = await dal.threatService.create(threat);

      const mitigation = new Mitigation(threat.id!, control.id!, "creator");
      const res1 = await data.create(mitigation);
      expect(res1).toBeTruthy();
      const { threatId, controlId } = res1
        ? res1
        : { threatId: "", controlId: "" };
      const res = await data.delete(threatId, randomUUID());
      expect(res).toBeFalsy();
      const fetched = await data.getById(threatId, controlId);
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.threatId).toBe(threat.id);
      expect(fetched?.controlId).toBe(control.id);
      expect(fetched?.createdBy).toBe("creator");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });
    it("should not be able to fetch deleted row", async () => {
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

      const threat = new Threat(
        "title",
        "description",
        model.id!,
        componentId,
        "createdBy"
      );
      threat.id = await dal.threatService.create(threat);

      const mitigation = new Mitigation(threat.id!, control.id!, "creator");
      const res1 = await data.create(mitigation);
      expect(res1).toBeTruthy();
      const { threatId, controlId } = res1
        ? res1
        : { threatId: "", controlId: "" };
      const res = await data.delete(threatId, controlId);
      expect(res).toBeTruthy();
      const fetched = await data.getById(threatId, controlId);
      expect(fetched).toBeFalsy();
    });
    it("should be able to un-delete a mitigation", async () => {
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

      const threat = new Threat(
        "title",
        "description",
        model.id!,
        componentId,
        "createdBy"
      );
      threat.id = await dal.threatService.create(threat);

      const mitigation = new Mitigation(threat.id!, control.id!, "creator");
      const res1 = await data.create(mitigation);
      expect(res1).toBeTruthy();
      const { threatId, controlId } = res1
        ? res1
        : { threatId: "", controlId: "" };
      const res = await data.delete(threatId, controlId);
      expect(res).toBeTruthy();

      const mitigationNew = new Mitigation(threatId, controlId, "Anotherone");
      const res2 = await data.create(mitigationNew);
      expect(res2).toBeTruthy();
      const { threatId: newThreatId, controlId: newControlId } = res2
        ? res2
        : { threatId: "", controlId: "" };

      const fetched = await data.getById(newThreatId, newControlId);
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.threatId).toBe(threat.id);
      expect(fetched?.controlId).toBe(control.id);
      expect(fetched?.createdBy).toBe("Anotherone");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });
  });
});
